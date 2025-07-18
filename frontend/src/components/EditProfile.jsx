import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";
import { PROFICIENCY_LEVELS, yearOptions, PRESET_SKILLS, PRESET_INTERESTS } from "./constants/profilePresets";

export default function EditPage() {
	const { session } = UserAuth();
	const navigate = useNavigate();

	const [userData, setUserData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const [form, setForm] = useState({
		name: "",
		year: "",
		bio: "",
		skills: {},
		interests: [],
		mentorRole: "",
		experienceYears: "",
		aiInterest: false,
		preferredMeeting: "",
		linkedInUrl: "",
	});
	const [skillInput, setSkillInput] = useState("");
	const [interestInput, setInterestInput] = useState("");
	const [profilePic, setProfilePic] = useState(null);
	const [profilePreview, setProfilePreview] = useState("");

	const setFormField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

	const fetchUserData = useCallback(async (userId) => {
		const { data, error } = await supabase.from("users").select("profile_picture, name, year, bio, skills, interests, points, mentor_role, experience_years, ai_interest, preferred_meeting, linked_in_url").eq("id", userId).single();
		if (error) return null;
		return data;
	}, []);

	useEffect(() => {
		(async () => {
			const userId = session?.user?.id;
			if (!userId) return;
			const data = await fetchUserData(userId);
			if (data) {
				setUserData(data);
				setForm({
					name: data.name || "",
					year: data.year || "",
					bio: data.bio || "",
					skills: data.skills || {},
					interests: data.interests || [],
					mentorRole: data.mentor_role || "",
					experienceYears: data.experience_years || "",
					aiInterest: data.ai_interest ?? false,
					preferredMeeting: data.preferred_meeting ?? "",
					linkedInUrl: data.linked_in_url || "",
				});
				setProfilePreview(data.profile_picture || "");
			}
			setLoading(false);
		})();
	}, [session, fetchUserData]);

	const toggleSkill = (skill) => {
		if (form.skills[skill]) {
			const updated = { ...form.skills };
			delete updated[skill];
			setFormField("skills", updated);
		} else {
			setFormField("skills", { ...form.skills, [skill]: "Beginner" });
		}
	};

	const setSkillLevel = (skill, level) => {
		setFormField("skills", { ...form.skills, [skill]: level });
	};

	const removeSkill = (skill) => {
		const updated = { ...form.skills };
		delete updated[skill];
		setFormField("skills", updated);
	};

	const addCustomSkill = () => {
		const v = skillInput.trim();
		if (v && !Object.keys(form.skills).includes(v)) setFormField("skills", { ...form.skills, [v]: "Beginner" });
		setSkillInput("");
	};

	const handleSkillKey = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addCustomSkill();
		}
	};

	const toggleInterest = (opt) => {
		setFormField("interests", form.interests.includes(opt) ? form.interests.filter((i) => i !== opt) : [...form.interests, opt]);
	};

	const removeInterest = (val) => {
		setFormField(
			"interests",
			form.interests.filter((i) => i !== val)
		);
	};

	const addCustomInterest = () => {
		const v = interestInput.trim();
		if (v && !form.interests.includes(v)) setFormField("interests", [...form.interests, v]);
		setInterestInput("");
	};

	const handleInterestKey = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addCustomInterest();
		}
	};

	const handleProfilePicChange = (e) => {
		const f = e.target.files[0];
		if (f) {
			setProfilePic(f);
			setProfilePreview(URL.createObjectURL(f));
		}
	};

	const handleSave = async () => {
		setSaving(true);
		setError("");
		const userId = session?.user?.id;
		let profile_picture_url = userData?.profile_picture;
		if (profilePic) {
			const ext = profilePic.name.split(".").pop();
			const path = `avatar/${userId}.${ext}`;
			const { error: upErr } = await supabase.storage.from("avatar").upload(path, profilePic, { upsert: true });
			if (upErr) {
				setError("Upload error: " + upErr.message);
				setSaving(false);
				return;
			}
			const { data: urlData } = supabase.storage.from("avatar").getPublicUrl(path);
			profile_picture_url = urlData.publicUrl;
			setProfilePreview(profile_picture_url);
		}
		const updates = {
			name: form.name,
			year: form.year,
			bio: form.bio,
			skills: form.skills,
			interests: form.interests,
			profile_picture: profile_picture_url,
			mentor_role: form.mentorRole,
			experience_years: form.experienceYears,
			ai_interest: form.aiInterest,
			preferred_meeting: form.preferredMeeting,
			linked_in_url: form.linkedInUrl,
		};
		const { error: saveErr } = await supabase.from("users").update(updates).eq("id", userId);
		if (saveErr) setError(saveErr.message);
		else navigate("/profile");
		setSaving(false);
	};

	const handleCancel = () => navigate("/profile");

	if (loading) return <LoadingSpinner />;

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900">
			<NavigationBar />
			<div className="py-8 px-4 max-w-4xl mx-auto">
				<h1 className="text-4xl font-bold mb-6">Edit Profile</h1>
				{error && <p className="text-red-500 mb-4">{error}</p>}
				<div className="space-y-6">
					<div className="bg-white p-6 rounded-xl shadow text-center">
						<div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4">
							<img src={profilePreview || "/default-avatar.png"} alt="avatar" className="object-cover w-full h-full" />
						</div>
						<input type="file" accept="image/*" onChange={handleProfilePicChange} className="mb-4" />
						<input type="text" className="w-full bg-gray-100 p-2 rounded mb-4" placeholder="Full Name" value={form.name} onChange={(e) => setFormField("name", e.target.value)} />
						<select className="w-full bg-gray-100 p-2 rounded" value={form.year} onChange={(e) => setFormField("year", e.target.value)}>
							<option value="">Select Year</option>
							{yearOptions.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
						<p className="mt-4 text-sm font-medium text-blue-600">{userData?.points ?? 0} points</p>
					</div>
					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">About Me</h3>
						<textarea rows={4} className="w-full bg-gray-100 p-2 rounded" placeholder="Tell us about yourself" value={form.bio} onChange={(e) => setFormField("bio", e.target.value)} />
					</div>
					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">LinkedIn URL</h3>
						<input type="url" className="w-full bg-gray-100 p-2 rounded" placeholder="https://www.linkedin.com/in/your-profile" value={form.linkedInUrl} onChange={(e) => setFormField("linkedInUrl", e.target.value)} />
					</div>
					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Skills</h3>
						<div className="flex flex-wrap gap-2 mb-4">
							{Object.entries(form.skills).map(([skill, level]) => (
								<div key={skill} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full">
									<span>{skill}</span>
									<select className="bg-white text-black text-sm rounded px-2 py-0.5" value={level} onChange={(e) => setSkillLevel(skill, e.target.value)}>
										{PROFICIENCY_LEVELS.map((lvl) => (
											<option key={lvl} value={lvl}>
												{lvl}
											</option>
										))}
									</select>
									<button onClick={() => removeSkill(skill)} className="ml-1 font-bold text-white">
										×
									</button>
								</div>
							))}
						</div>
						<div className="flex flex-wrap gap-2 mb-4">
							{PRESET_SKILLS.filter((opt) => !Object.keys(form.skills).includes(opt)).map((opt) => (
								<button key={opt} onClick={() => toggleSkill(opt)} className="px-3 py-1 rounded-full border border-gray-400 text-gray-700 hover:bg-gray-200">
									{opt}
								</button>
							))}
						</div>
						<div className="flex gap-2">
							<input className="flex-1 bg-gray-100 p-2 rounded" placeholder="Add a skill..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleSkillKey} />
							<button onClick={addCustomSkill} className="px-4 rounded bg-blue-600 text-white">
								+
							</button>
						</div>
					</div>
					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Interests</h3>
						<div className="flex flex-wrap gap-2 mb-4">
							{form.interests.map((i) => (
								<span key={i} className="flex items-center bg-purple-500 text-white px-3 py-1 rounded-full">
									{i}
									<button onClick={() => removeInterest(i)} className="ml-2 font-bold">
										×
									</button>
								</span>
							))}
						</div>
						<div className="flex flex-wrap gap-2 mb-4">
							{PRESET_INTERESTS.filter((opt) => !form.interests.includes(opt)).map((opt) => (
								<button key={opt} onClick={() => toggleInterest(opt)} className="px-3 py-1 rounded-full border border-gray-400 text-gray-700 hover:bg-gray-200">
									{opt}
								</button>
							))}
						</div>
						<div className="flex gap-2">
							<input className="flex-1 bg-gray-100 p-2 rounded" placeholder="Add an interest..." value={interestInput} onChange={(e) => setInterestInput(e.target.value)} onKeyDown={handleInterestKey} />
							<button onClick={addCustomInterest} className="px-4 rounded bg-purple-600 text-white">
								+
							</button>
						</div>
					</div>
					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Mentorship Role</h3>
						<div className="flex gap-4">
							<label className="flex items-center gap-2">
								<input type="radio" name="mentorRole" value="Mentor" checked={form.mentorRole === "Mentor"} onChange={() => setFormField("mentorRole", "Mentor")} />
								Mentor
							</label>
							<label className="flex items-center gap-2">
								<input type="radio" name="mentorRole" value="Mentee" checked={form.mentorRole === "Mentee"} onChange={() => setFormField("mentorRole", "Mentee")} />
								Mentee
							</label>
							<label className="flex items-center gap-2">
								<input type="radio" name="mentorRole" value="" checked={form.mentorRole === ""} onChange={() => setFormField("mentorRole", "")} />
								None
							</label>
						</div>
					</div>
					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Years of Experience</h3>
						<select className="w-full bg-gray-100 p-2 rounded" value={form.experienceYears} onChange={(e) => setFormField("experienceYears", e.target.value)}>
							<option value="">Select experience</option>
							<option value="0">0 (Just getting started)</option>
							<option value="1">1 year</option>
							<option value="2">2 years</option>
							<option value="3">3 years</option>
							<option value="4+">4+ years</option>
						</select>
					</div>
					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Are you interested in AI?</h3>
						<div className="flex items-center gap-4">
							<label className="flex items-center gap-2">
								<input type="radio" name="aiInterest" checked={form.aiInterest === true} onChange={() => setFormField("aiInterest", true)} />
								Yes
							</label>
							<label className="flex items-center gap-2">
								<input type="radio" name="aiInterest" checked={form.aiInterest === false} onChange={() => setFormField("aiInterest", false)} />
								No
							</label>
						</div>
					</div>
					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Preferred Meeting Type</h3>
						<select className="w-full bg-gray-100 p-2 rounded" value={form.preferredMeeting} onChange={(e) => setFormField("preferredMeeting", e.target.value)}>
							<option value="">Select preference</option>
							<option value="In person">In person</option>
							<option value="Zoom">Zoom</option>
							<option value="Either">Either</option>
						</select>
					</div>
					<div className="flex justify-center gap-4 pt-4">
						<button onClick={handleCancel} className="px-6 py-2 bg-gray-600 text-white rounded">
							Cancel
						</button>
						<button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded">
							{saving ? "Saving…" : "Save Changes"}
						</button>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
}
