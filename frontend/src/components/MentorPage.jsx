import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
	const navigate = useNavigate();

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

			<div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white min-h-screen">
				<NavigationBar />
				<div className="flex flex-col items-center mt-12 space-y-4 text-center">
					<div className="flex items-center space-x-2">
						<img src="/MICS_Colorstack_Logo_Light.png" alt="MICS by ColorStack" className="h-16 w-auto mr-4" />
						<h1 className="text-5xl font-black text-white tracking-tight">Mentor Matching</h1>

						<div className="relative inline-block">
							<HelpCircle className="peer w-6 h-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
							<div
								className="
      pointer-events-none opacity-0 peer-hover:opacity-100 transition-opacity duration-200
      absolute top-full left-1/2 transform -translate-x-1/2 mt-2
      w-72 bg-white/95 backdrop-blur-sm border border-gray-200
      text-gray-900 text-sm rounded-lg shadow-lg p-4 z-50
    "
							>
								<div
									className="
        absolute -top-2 left-1/2 transform -translate-x-1/2
        w-3 h-3 bg-white/95 border-l border-t border-gray-200 rotate-45
      "
								/>
								<h3 className="font-semibold text-gray-900 mb-2">How matching works</h3>
								<ul className="list-decimal list-inside space-y-2">
									<li>
										<span className="font-semibold text-indigo-600">Vectorize</span> you & mentors on&nbsp;
										<span className="italic">skills</span>, <span className="italic">interests</span>,&nbsp;
										<span className="italic">AI interest</span>, <span className="italic">experience</span>, and&nbsp;
										<span className="italic">meeting type</span>.
									</li>
									<li>
										<span className="font-semibold text-indigo-600">Compute</span> cosine similarity + your likes to build a weighted graph.
									</li>
									<li>
										<span className="font-semibold text-indigo-600">Run</span> Personalized PageRank from you to rank mentors by proximity.
									</li>
									<li>
										<span className="font-semibold text-indigo-600">Blend</span> 60% PageRank & 40% cosine for the final ranking.
									</li>
								</ul>
							</div>
						</div>
					</div>

					<p className="text-white text-lg font-semibold max-w-2xl relative z-10">
						Find mentors who match your&nbsp;
						<span className="text-yellow-300 font-semibold">skills</span>,&nbsp;
						<span className="text-yellow-300 font-semibold">interests</span>,&nbsp;
						<span className="text-yellow-300 font-semibold">meeting type</span>,&nbsp;
						<span className="text-yellow-300 font-semibold">AI interest</span>, and&nbsp;
						<span className="text-yellow-300 font-semibold">experience</span>. Customize the weights below to get the most relevant recommendations.
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
						<div key={mentor.id} className="hover-pulse transition-transform transform hover:scale-105 hover:ring-4 hover:ring-indigo-300 hover:ring-opacity-40 hover:ring-offset-2 bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center text-center border border-blue-200 relative cursor-pointer" onClick={() => navigate(`/member/${mentor.id}?from=mentors`)}>
							<div className="absolute top-3 right-3">
								<HelpCircle className="peer w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
								<div className="opacity-0 peer-hover:opacity-100 transition-opacity  absolute right-0 mt-1 w-64 p-3 bg-white text-gray-800 text-sm rounded-lg shadow-lg z-20">
									<div className="font-bold mb-2">Why did we match you?</div>
									{generateMatchExplanation(userProfile, mentor)}
								</div>
							</div>

							<div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-blue-200 mb-4">
								<img src={mentor.profile_picture || "/default-avatar.svg"} alt={mentor.name} className="object-cover w-full h-full" />
							</div>

							<div className="text-xl font-bold flex items-center gap-2 mb-2 text-gray-900">
								{mentor.name}
								<span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Mentor</span>
							</div>

							<div className="text-sm text-gray-600 mb-3">
								{mentor.year || "N/A"} • {mentor.experience_years || 0} yr
								{mentor.experience_years === 1 ? "" : "s"} experience
							</div>

							<p className="text-sm text-gray-700 mb-4">{mentor.bio || "No bio available."}</p>

							<div className="w-full mb-4">
								<div className="font-semibold text-sm mb-1 text-gray-900">Skills</div>
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
								<div className="font-semibold text-sm mb-1 text-gray-900">Interests</div>
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
								<a href={mentor.linked_in_url || "#"} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm transition-colors duration-200 flex items-center ${mentor.linked_in_url ? "" : "opacity-50 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
									<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
									</svg>
									Connect on LinkedIn
								</a>

								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleLike(mentor.id);
									}}
									className={`px-4 py-2 rounded-full text-sm shadow-sm ${likedMentors.has(mentor.id) ? "bg-red-400 hover:bg-red-500 text-white" : "bg-yellow-400 hover:bg-yellow-500 text-white"}`}
								>
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
