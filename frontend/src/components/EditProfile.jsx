import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

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
	const [skills, setSkills] = useState([]);
	const [interests, setInterests] = useState([]);
	const [skillInput, setSkillInput] = useState("");
	const [interestInput, setInterestInput] = useState("");

	const yearOptions = ["Freshman", "Sophomore", "Junior", "Senior"];

	useEffect(() => {
		const fetchUser = async () => {
			const userId = session?.user?.id;
			if (!userId) return;

			const { data, error } = await supabase.from("users").select("profile_picture, name, year, bio, skills, interests, points").eq("id", userId).single();

			if (error) {
				console.error(error.message);
			} else {
				setUserData(data);
				setName(data.name || "");
				setYear(data.year || "");
				setBio(data.bio || "");
				setSkills(data.skills || []);
				setInterests(data.interests || []);
			}
			setLoading(false);
		};
		fetchUser();
	}, [session]);

	const addSkill = () => {
		const v = skillInput.trim();
		if (v && !skills.includes(v)) setSkills([...skills, v]);
		setSkillInput("");
	};
	const removeSkill = (i) => setSkills(skills.filter((_, idx) => idx !== i));

	const addInterest = () => {
		const v = interestInput.trim();
		if (v && !interests.includes(v)) setInterests([...interests, v]);
		setInterestInput("");
	};
	const removeInterest = (i) => setInterests(interests.filter((_, idx) => idx !== i));

	const handleSave = async () => {
		setSaving(true);
		setError("");
		const userId = session.user.id;
		const updates = { name, year, bio, skills, interests };
		const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select();
		console.log("Updated bio:", data?.[0]?.bio);
		if (error) setError(error.message);
		else navigate("/profile");
		setSaving(false);
	};

	const handleCancel = () => navigate("/profile");

	if (loading || !userData) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-blue-100 text-gray-700">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900">
			<NavigationBar />
			<div className="max-w-6xl mx-auto p-6">
				<h1 className="text-4xl font-bold mb-8">Edit Profile</h1>

				{error && <p className="text-red-500 mb-4">{error}</p>}

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-white p-6 rounded-xl shadow flex flex-col items-center text-center">
						<div className="w-24 h-24 rounded-full bg-gray-300 mb-4"></div>
						<input type="text" className="mt-2 bg-gray-100 p-2 rounded-md w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
						<select className="mt-4 bg-gray-100 p-2 rounded-md w-full" value={year} onChange={(e) => setYear(e.target.value)}>
							<option value="">Select Year</option>
							{yearOptions.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
						<span className="mt-4 px-3 py-1 text-sm font-medium border border-blue-500 text-blue-500 rounded-full">{userData.points ?? 0} points</span>
					</div>

					<div className="md:col-span-2 flex flex-col gap-4">
						<div className="bg-white p-6 rounded-xl shadow">
							<h3 className="text-xl font-bold mb-2">About Me</h3>
							<textarea rows={4} className="w-full bg-gray-100 p-2 rounded-md" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
						</div>

						<div className="bg-white p-6 rounded-xl shadow">
							<h3 className="text-xl font-bold mb-2">Skills</h3>
							<div className="flex flex-wrap gap-2 mb-2">
								{skills.map((s, i) => (
									<span key={i} className="bg-blue-100 px-3 py-1 rounded-full flex items-center">
										{s}
										<button onClick={() => removeSkill(i)} className="ml-2 text-red-500">
											×
										</button>
									</span>
								))}
							</div>
							<div className="flex gap-2">
								<input className="flex-1 bg-gray-100 p-2 rounded-md" placeholder="Add a skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} />
								<button onClick={addSkill} className="bg-blue-500 text-white px-4 py-2 rounded-md">
									Add
								</button>
							</div>
						</div>

						<div className="bg-white p-6 rounded-xl shadow">
							<h3 className="text-xl font-bold mb-2">Interests</h3>
							<div className="flex flex-wrap gap-2 mb-2">
								{interests.map((i, k) => (
									<span key={k} className="bg-blue-100 px-3 py-1 rounded-full flex items-center">
										{i}
										<button onClick={() => removeInterest(k)} className="ml-2 text-red-500">
											×
										</button>
									</span>
								))}
							</div>
							<div className="flex gap-2">
								<input className="flex-1 bg-gray-100 p-2 rounded-md" placeholder="Add an interest" value={interestInput} onChange={(e) => setInterestInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addInterest()} />
								<button onClick={addInterest} className="bg-blue-500 text-white px-4 py-2 rounded-md">
									Add
								</button>
							</div>
						</div>

						<div className="flex justify-center mt-6 space-x-2">
							<button onClick={handleCancel} className="bg-gray-600 text-white px-4 py-2 rounded-md">
								Cancel
							</button>
							<button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-md">
								{saving ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
