import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";

export default function EditPage() {
	const { session } = UserAuth();
	const navigate = useNavigate();

	const [userData, setUserData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const [name, setName] = useState("");
	const [year, setYear] = useState("");
	const [bio, setBio] = useState("");
	const [skills, setSkills] = useState({});
	const [interests, setInterests] = useState([]);
	const [skillInput, setSkillInput] = useState("");
	const [interestInput, setInterestInput] = useState("");
	const [profilePic, setProfilePic] = useState(null);
	const [profilePreview, setProfilePreview] = useState("");
	const [mentorRole, setMentorRole] = useState("");
	const [experienceYears, setExperienceYears] = useState("");
	const [aiInterest, setAiInterest] = useState(false);
	const [preferredMeeting, setPreferredMeeting] = useState("");
	const [linkedInUrl, setLinkedInUrl] = useState("");

	const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced"];
	const yearOptions = ["Freshman", "Sophomore", "Junior", "Senior"];

	const PRESET_SKILLS = [
		"Python",
		"JavaScript",
		"Java",
		"C++",
		"HTML",
		"CSS",
		"SQL",
		"C#",
		"React",
		"Tailwind CSS",
		"Node.js",
		"Express.js",
		"Next.js",
		"Flask",
		"Django",
		"Bootstrap",
		"MongoDB",
		"PostgreSQL",
		"MySQL",
		"Firebase",
		"Supabase",
		"Git / Version Control",
		"REST APIs",
		"Web Development",
		"Mobile Development",
		"UI/UX Design",
		"Data Structures & Algorithms",
		"Object-Oriented Programming",
		"Resume Building",
		"Mock Interviews",
		"System Design",
		"Frontend",
		"Backend Development",
		"Full Stack Development",
	];

	const PRESET_INTERESTS = ["Software Engineering", "Product Management", "Program Management", "Project Management", "Consulting", "Cybersecurity", "Startups & Entrepreneurship", "Data Science & Analytics", "Anime & Gaming", "Stocks & Investing", "Content Creation", "Sports & Fitness", "Music & Performing Arts", "Leadership & Public Speaking", "Diversity in Tech"];

	useEffect(() => {
		(async () => {
			const userId = session?.user?.id;
			if (!userId) return;

			const { data, error } = await supabase.from("users").select("profile_picture, name, year, bio, skills, interests, points, mentor_role, experience_years, ai_interest, preferred_meeting, linked_in_url").eq("id", userId).single();

			if (error) {
				console.error(error.message);
			} else {
				setUserData(data);
				setName(data.name || "");
				setYear(data.year || "");
				setBio(data.bio || "");
				setSkills(data.skills || {});
				setInterests(data.interests || []);
				setProfilePreview(data.profile_picture || "");
				setMentorRole(data.mentor_role || "");
				setExperienceYears(data.experience_years || "");
				setAiInterest(data.ai_interest ?? false);
				setPreferredMeeting(data.preferred_meeting ?? "");
				setLinkedInUrl(data.linked_in_url || "");
			}
			setLoading(false);
		})();
	}, [session]);

	const toggleSkill = (skill) => {
		if (skills[skill]) {
			const updated = { ...skills };
			delete updated[skill];
			setSkills(updated);
		} else {
			setSkills({ ...skills, [skill]: "Beginner" });
		}
	};

	const setSkillLevel = (skill, level) => {
		setSkills({ ...skills, [skill]: level });
	};

	const removeSkill = (skill) => {
		const updated = { ...skills };
		delete updated[skill];
		setSkills(updated);
	};

	const addCustomSkill = () => {
		const v = skillInput.trim();
		if (v && !Object.keys(skills).includes(v)) setSkills({ ...skills, [v]: "Beginner" });
		setSkillInput("");
	};

	const handleSkillKey = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addCustomSkill();
		}
	};

	const toggleInterest = (opt) => {
		setInterests(interests.includes(opt) ? interests.filter((i) => i !== opt) : [...interests, opt]);
	};

	const removeInterest = (val) => {
		setInterests(interests.filter((i) => i !== val));
	};

	const addCustomInterest = () => {
		const v = interestInput.trim();
		if (v && !interests.includes(v)) setInterests([...interests, v]);
		setInterestInput("");
	};

	const handleInterestKey = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addCustomInterest();
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
			name,
			year,
			bio,
			skills,
			interests,
			profile_picture: profile_picture_url,
			mentor_role: mentorRole,
			experience_years: experienceYears,
			ai_interest: aiInterest,
			preferred_meeting: preferredMeeting,
			linked_in_url: linkedInUrl,
		};

		const { error: saveErr } = await supabase.from("users").update(updates).eq("id", userId);

		if (saveErr) setError(saveErr.message);
		else navigate("/profile");

		setSaving(false);
	};

	const handleProfilePicChange = (e) => {
		const f = e.target.files[0];
		if (f) {
			setProfilePic(f);
			setProfilePreview(URL.createObjectURL(f));
		}
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
						<input type="text" className="w-full bg-gray-100 p-2 rounded mb-4" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
						<select className="w-full bg-gray-100 p-2 rounded" value={year} onChange={(e) => setYear(e.target.value)}>
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
						<textarea rows={4} className="w-full bg-gray-100 p-2 rounded" placeholder="Tell us about yourself" value={bio} onChange={(e) => setBio(e.target.value)} />
					</div>

					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">LinkedIn URL</h3>
						<input type="url" className="w-full bg-gray-100 p-2 rounded" placeholder="https://www.linkedin.com/in/your-profile" value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} />
					</div>

					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Skills</h3>
						<div className="flex flex-wrap gap-2 mb-4">
							{Object.entries(skills).map(([skill, level]) => (
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
							{PRESET_SKILLS.filter((opt) => !Object.keys(skills).includes(opt)).map((opt) => (
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
							{interests.map((i) => (
								<span key={i} className="flex items-center bg-purple-500 text-white px-3 py-1 rounded-full">
									{i}
									<button onClick={() => removeInterest(i)} className="ml-2 font-bold">
										×
									</button>
								</span>
							))}
						</div>
						<div className="flex flex-wrap gap-2 mb-4">
							{PRESET_INTERESTS.filter((opt) => !interests.includes(opt)).map((opt) => (
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
								<input type="radio" name="mentorRole" value="Mentor" checked={mentorRole === "Mentor"} onChange={() => setMentorRole("Mentor")} />
								Mentor
							</label>
							<label className="flex items-center gap-2">
								<input type="radio" name="mentorRole" value="Mentee" checked={mentorRole === "Mentee"} onChange={() => setMentorRole("Mentee")} />
								Mentee
							</label>
							<label className="flex items-center gap-2">
								<input type="radio" name="mentorRole" value="" checked={mentorRole === ""} onChange={() => setMentorRole("")} />
								None
							</label>
						</div>
					</div>

					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Years of Experience</h3>
						<select className="w-full bg-gray-100 p-2 rounded" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}>
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
								<input type="radio" name="aiInterest" checked={aiInterest === true} onChange={() => setAiInterest(true)} />
								Yes
							</label>
							<label className="flex items-center gap-2">
								<input type="radio" name="aiInterest" checked={aiInterest === false} onChange={() => setAiInterest(false)} />
								No
							</label>
						</div>
					</div>

					<div className="bg-white p-6 rounded-xl shadow">
						<h3 className="text-xl font-bold mb-2">Preferred Meeting Type</h3>
						<select className="w-full bg-gray-100 p-2 rounded" value={preferredMeeting} onChange={(e) => setPreferredMeeting(e.target.value)}>
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
