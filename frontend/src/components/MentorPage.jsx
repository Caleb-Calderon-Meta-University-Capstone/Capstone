import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import { getTopMentorMatches } from "../utils/mentorMatchUtils";
import { UserAuth } from "../context/AuthContext";
import { PRESET_SKILLS, PRESET_INTERESTS } from "./constants/presets";

export default function MentorPage() {
	const { session } = UserAuth();
	const userId = session?.user?.id;

	const [weights, setWeights] = useState({
		skills: 0.4,
		interests: 0.3,
		ai_interest: 0.1,
		experience_years: 0.1,
		preferred_meeting: 0.1,
	});
	const [showWeightModal, setShowWeightModal] = useState(false);

	const [userProfile, setUserProfile] = useState(null);
	const [mentors, setMentors] = useState([]);
	const [likesMap, setLikesMap] = useState({});
	const [likedMentors, setLikedMentors] = useState(new Set());
	const [topMentors, setTopMentors] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!userId) return;
		(async () => {
			const { data, error } = await supabase.from("users").select("id, name, year, bio, skills, interests, ai_interest, experience_years, preferred_meeting, points, profile_picture").eq("id", userId).single();
			if (error) console.error("Error loading user profile:", error);
			else setUserProfile(data);
		})();
	}, [userId]);

	useEffect(() => {
		if (!userProfile) return;
		(async () => {
			const { data, error } = await supabase.from("users").select("*").ilike("mentor_role", "mentor").neq("id", userId);
			if (error) console.error("Error fetching mentors:", error);
			else setMentors(data);
		})();
	}, [userProfile, userId]);

	useEffect(() => {
		if (!userId || mentors.length === 0) return;
		(async () => {
			const mentorIds = mentors.map((m) => m.id);
			const { data: rows, error } = await supabase.from("interactions").select("to_user, weight").eq("type", "like").eq("from_user", userId).in("to_user", mentorIds);
			if (error) {
				console.error("Error fetching likes:", error);
				setLikesMap({});
			} else {
				const map = {};
				rows.forEach(({ to_user, weight }) => {
					map[to_user] = (map[to_user] || 0) + weight;
				});
				setLikesMap(map);
				setLikedMentors(new Set(Object.keys(map)));
			}
		})();
	}, [userId, mentors]);

	useEffect(() => {
		if (!userProfile || mentors.length === 0) return;
		const topN = Math.min(mentors.length, 6);
		const matches = getTopMentorMatches(userProfile, mentors, PRESET_SKILLS, PRESET_INTERESTS, likesMap, topN, weights);
		setTopMentors(matches);
		setLoading(false);
	}, [userProfile, mentors, likesMap, weights]);

	const toggleLike = async (mentorId) => {
		if (!userId) return;
		const isLiked = likedMentors.has(mentorId);
		if (isLiked) {
			const { error } = await supabase.from("interactions").delete().eq("from_user", userId).eq("to_user", mentorId).eq("type", "like");
			if (error) console.error("Error unliking:", error);
			else {
				setLikedMentors((prev) => {
					const next = new Set(prev);
					next.delete(mentorId);
					return next;
				});
				setLikesMap((prev) => {
					const next = { ...prev };
					delete next[mentorId];
					return next;
				});
			}
		} else {
			const { error } = await supabase.from("interactions").insert({ from_user: userId, to_user: mentorId, type: "like", weight: 1 });
			if (error) console.error("Error liking:", error);
			else {
				setLikedMentors((prev) => new Set(prev).add(mentorId));
				setLikesMap((prev) => ({
					...prev,
					[mentorId]: (prev[mentorId] || 0) + 1,
				}));
			}
		}
	};

	if (loading) return <LoadingSpinner />;

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<NavigationBar />
			<div className="flex justify-between items-center mx-10 mt-6">
				<h1 className="text-3xl font-bold">Mentor Matching</h1>
				<button onClick={() => setShowWeightModal(true)} className="px-4 py-2 bg-gray-200 rounded">
					Adjust Weights
				</button>
			</div>

			{showWeightModal && (
				<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white p-6 rounded-lg w-96 z-50">
						<h2 className="text-xl mb-4">Feature Weights</h2>
						{Object.entries(weights).map(([key, val]) => (
							<div key={key} className="mb-3">
								<label className="block font-medium">{key.replace("_", " ")}</label>
								<input type="range" min="0" max="1" step="0.01" value={val} onChange={(e) => setWeights((w) => ({ ...w, [key]: parseFloat(e.target.value) }))} className="w-full" />
								<div className="text-sm text-right">{(val * 100).toFixed(0)}%</div>
							</div>
						))}
						<div className="flex justify-end gap-2 mt-4">
							<button onClick={() => setShowWeightModal(false)} className="px-4 py-2 bg-gray-200 rounded">
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 m-10">
				{topMentors.map(({ mentor, score }) => (
					<div key={mentor.id} className="relative bg-white shadow-lg rounded-xl p-6 flex flex-col items-center text-center border border-blue-200">
						<div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-blue-200 mb-4">
							<img src={mentor.profile_picture || "https://picsum.photos/200"} alt={mentor.name} className="object-cover w-full h-full" />
						</div>
						<div className="text-lg font-bold flex items-center gap-2">
							{mentor.name}
							<span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Mentor</span>
						</div>
						<div className="text-sm text-gray-600 mb-2">
							{mentor.year || "N/A"} • {mentor.experience_years || 0} yrs experience
						</div>
						<p className="text-sm text-gray-700 mb-3">{mentor.bio || "No bio available."}</p>
						<div className="w-full mb-3">
							<div className="font-semibold text-sm mb-1">Skills</div>
							<div className="flex flex-wrap gap-2 justify-center">
								{mentor.skills &&
									Object.entries(mentor.skills).map(([skill, level]) => (
										<span key={skill} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
											{skill} ({level})
										</span>
									))}
							</div>
						</div>
						<div className="w-full mb-3">
							<div className="font-semibold text-sm mb-1">Interests</div>
							<div className="flex flex-wrap gap-2 justify-center">
								{mentor.interests?.map((interest, i) => (
									<span key={i} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
										{interest}
									</span>
								))}
							</div>
						</div>
						<div className="w-full mb-2">
							<div className="text-sm text-gray-600 font-medium mb-1">Match Score</div>
							<div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
								<div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${Math.round(score * 100)}%` }} />
							</div>
							<div className="text-sm mt-1 text-blue-700 font-semibold">{Math.round(score * 100)}% match</div>
						</div>
						<div className="text-sm text-gray-600 mb-2">{mentor.points ?? 0} total points</div>
						<div className="flex gap-2">
							<button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm">Connect</button>
							<button onClick={() => toggleLike(mentor.id)} className={`px-4 py-2 rounded-full text-sm shadow-sm ${likedMentors.has(mentor.id) ? "bg-red-400 hover:bg-red-500 text-white" : "bg-yellow-400 hover:bg-yellow-500 text-white"}`}>
								{likedMentors.has(mentor.id) ? "Unlike" : "Like"}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
