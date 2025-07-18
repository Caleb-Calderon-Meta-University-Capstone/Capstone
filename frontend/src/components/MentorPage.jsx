import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import { getTopMentorMatches, generateMatchExplanation } from "../utils/mentorMatchUtils";
import { UserAuth } from "../context/AuthContext";
import { PRESET_SKILLS, PRESET_INTERESTS } from "./constants/presets";
import Footer from "./Footer";
import { HelpCircle } from "lucide-react";

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
			if (!error) setUserProfile(data);
		})();
	}, [userId]);

	useEffect(() => {
		if (!userProfile) return;
		(async () => {
			const { data, error } = await supabase.from("users").select("*").ilike("mentor_role", "mentor").neq("id", userId);
			if (!error) setMentors(data);
		})();
	}, [userProfile, userId]);

	useEffect(() => {
		if (!userId || mentors.length === 0) return;
		(async () => {
			const mentorIds = mentors.map((m) => m.id);
			const { data, error } = await supabase.from("interactions").select("to_user, weight").eq("type", "like").eq("from_user", userId).in("to_user", mentorIds);
			if (!error) {
				const map = {};
				data.forEach(({ to_user, weight }) => {
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
			if (!error) {
				setLikedMentors((prev) => {
					const next = new Set(prev);
					next.delete(mentorId);
					return next;
				});
				setLikesMap((prev) => {
					const { [mentorId]: _, ...rest } = prev;
					return rest;
				});
			}
		} else {
			const { error } = await supabase.from("interactions").insert({ from_user: userId, to_user: mentorId, type: "like", weight: 1 });
			if (!error) {
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
		<>
			<style>{`
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 0 rgba(99,102,241,.3); }
          50% { box-shadow: 0 0 20px rgba(99,102,241,.4); }
        }
        .hover-pulse:hover { animation: pulse-glow 1.8s ease-in-out infinite; }
      `}</style>

			<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
				<NavigationBar />
				<div className="flex flex-col items-center mt-12 space-y-4 text-center">
					<h1 className="text-5xl font-black text-gray-900 tracking-tight relative z-10">Mentor Matching</h1>

					<p className="text-gray-600 text-lg font-semibold max-w-2xl relative z-10">
						Find mentors who match your <span className="text-indigo-600 font-semibold">skills</span>, <span className="text-indigo-600 font-semibold">interests</span>, <span className="text-indigo-600 font-semibold">meeting type</span>, <span className="text-indigo-600 font-semibold">ai interest</span>, and <span className="text-indigo-600 font-semibold">experience</span>. Customize the weights below to get the most relevant recommendations.
					</p>

					<button onClick={() => setShowWeightModal(true)} className="mt-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow">
						Adjust Weights
					</button>
				</div>

				{showWeightModal && (
					<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
						<div className="bg-white p-6 rounded-lg w-96">
							<h2 className="text-xl mb-4">Feature Weights</h2>
							{Object.entries(weights).map(([key, val]) => (
								<div key={key} className="mb-3">
									<label className="block font-medium">{key.replace("_", " ")}</label>
									<input
										type="range"
										min="0"
										max="1"
										step="0.01"
										value={val}
										onChange={(e) =>
											setWeights((w) => ({
												...w,
												[key]: parseFloat(e.target.value),
											}))
										}
										className="w-full"
									/>
									<div className="text-sm text-right">{(val * 100).toFixed(0)}%</div>
								</div>
							))}
							<div className="flex justify-end mt-4">
								<button onClick={() => setShowWeightModal(false)} className="px-4 py-2 bg-gray-200 rounded">
									Close
								</button>
							</div>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-8 py-6">
					{topMentors.map(({ mentor, score }) => (
						<div key={mentor.id} className="hover-pulse transition-transform transform hover:scale-105 hover:ring-4 hover:ring-indigo-300 hover:ring-opacity-40 hover:ring-offset-2 bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center text-center border border-blue-200">
							<div className="absolute top-3 right-3">
								<HelpCircle className="peer w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
								<div className="opacity-0 peer-hover:opacity-100 transition-opacity absolute right-0 mt-1 w-64 p-3 bg-white text-gray-800 text-sm rounded-lg shadow-lg z-20">{generateMatchExplanation(userProfile, mentor)}</div>
							</div>

							<div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-blue-200 mb-4">
								<img src={mentor.profile_picture || "https://picsum.photos/200"} alt={mentor.name} className="object-cover w-full h-full" />
							</div>

							<div className="text-xl font-bold flex items-center gap-2 mb-2">
								{mentor.name}
								<span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Mentor</span>
							</div>

							<div className="text-sm text-gray-600 mb-3">
								{mentor.year || "N/A"} • {mentor.experience_years || 0} yr
								{mentor.experience_years === 1 ? "" : "s"} experience
							</div>

							<p className="text-sm text-gray-700 mb-4">{mentor.bio || "No bio available."}</p>

							<div className="w-full mb-4">
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
									{mentor.interests?.map((interest) => (
										<span key={interest} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
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
								<a href={mentor.linked_in_url || "#"} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm ${mentor.linked_in_url ? "" : "opacity-50 pointer-events-none"}`}>
									Connect
								</a>

								<button onClick={() => toggleLike(mentor.id)} className={`px-4 py-2 rounded-full text-sm shadow-sm ${likedMentors.has(mentor.id) ? "bg-red-400 hover:bg-red-500 text-white" : "bg-yellow-400 hover:bg-yellow-500 text-white"}`}>
									{likedMentors.has(mentor.id) ? "Unlike" : "Like"}
								</button>
							</div>
						</div>
					))}
				</div>
				<Footer />
			</div>
		</>
	);
}
