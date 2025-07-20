import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import { getTopMentorMatches, generateMatchExplanation } from "../utils/mentorMatchUtils";
import { UserAuth } from "../context/AuthContext";
import { PRESET_SKILLS, PRESET_INTERESTS } from "./constants/presets";
import Footer from "./Footer";
import { HelpCircle } from "lucide-react";

const WeightModal = ({ weights, setWeights, isOpen, onClose }) => {
	if (!isOpen) return null;

	return (
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
					<button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors">
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

const HelpTooltip = ({ children, className = "" }) => (
	<div className={`relative inline-block ${className}`}>
		<HelpCircle className="peer w-6 h-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
		<div className="pointer-events-none opacity-0 peer-hover:opacity-100 transition-opacity duration-200 absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-900 text-sm rounded-lg shadow-lg p-4 z-50">
			<div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/95 border-l border-t border-gray-200 rotate-45" />
			{children}
		</div>
	</div>
);

const Header = ({ onAdjustWeights }) => (
	<div className="flex flex-col items-center mt-12 space-y-4 text-center">
		<div className="flex items-center space-x-2">
			<img src="/MICS_Colorstack_Logo.png" alt="MICS by ColorStack" className="h-16 w-auto mr-4" />
			<h1 className="text-5xl font-black text-gray-900 tracking-tight">Mentor Matching</h1>

			<HelpTooltip>
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
			</HelpTooltip>
		</div>

		<p className="text-gray-600 text-lg font-semibold max-w-2xl relative z-10">
			Find mentors who match your&nbsp;
			<span className="text-indigo-600 font-semibold">skills</span>,&nbsp;
			<span className="text-indigo-600 font-semibold">interests</span>,&nbsp;
			<span className="text-indigo-600 font-semibold">meeting type</span>,&nbsp;
			<span className="text-indigo-600 font-semibold">AI interest</span>, and&nbsp;
			<span className="text-indigo-600 font-semibold">experience</span>. Customize the weights below to get the most relevant recommendations.
		</p>

		<button onClick={onAdjustWeights} className="mt-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition-colors">
			Adjust Weights
		</button>
	</div>
);

const SkillsSection = ({ skills }) => {
	if (!skills || Object.keys(skills).length === 0) {
		return (
			<div className="w-full mb-4">
				<div className="font-semibold text-sm mb-1">Skills</div>
				<div className="text-xs text-gray-500">No skills listed</div>
			</div>
		);
	}

	return (
		<div className="w-full mb-4">
			<div className="font-semibold text-sm mb-1">Skills</div>
			<div className="flex flex-wrap gap-2 justify-center">
				{Object.entries(skills).map(([skill, level]) => (
					<span key={skill} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
						{skill} ({level})
					</span>
				))}
			</div>
		</div>
	);
};

const InterestsSection = ({ interests }) => {
	if (!interests || interests.length === 0) {
		return (
			<div className="w-full mb-3">
				<div className="font-semibold text-sm mb-1">Interests</div>
				<div className="text-xs text-gray-500">No interests listed</div>
			</div>
		);
	}

	return (
		<div className="w-full mb-3">
			<div className="font-semibold text-sm mb-1">Interests</div>
			<div className="flex flex-wrap gap-2 justify-center">
				{interests.map((interest) => (
					<span key={interest} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
						{interest}
					</span>
				))}
			</div>
		</div>
	);
};

const MatchScore = ({ score }) => (
	<div className="w-full mb-2">
		<div className="text-sm text-gray-600 font-medium mb-1">Match Score</div>
		<div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
			<div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${Math.round(score * 100)}%` }} />
		</div>
		<div className="text-sm mt-1 text-blue-700 font-semibold">{Math.round(score * 100)}% match</div>
	</div>
);

const MentorCard = ({ mentor, score, userProfile, isLiked, onToggleLike }) => {
	const profilePicture = mentor.profile_picture || "/default-avatar.svg";
	const hasLinkedIn = mentor.linked_in_url && mentor.linked_in_url !== "#";

	return (
		<div className="hover-pulse transition-transform transform hover:scale-105 hover:ring-4 hover:ring-indigo-300 hover:ring-opacity-40 hover:ring-offset-2 bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center text-center border border-blue-200 relative">
			<div className="absolute top-3 right-3">
				<HelpCircle className="peer w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
				<div className="opacity-0 peer-hover:opacity-100 transition-opacity absolute right-0 mt-1 w-64 p-3 bg-white text-gray-800 text-sm rounded-lg shadow-lg z-20">
					<div className="font-bold mb-2">Why did we match you?</div>
					{generateMatchExplanation(userProfile, mentor)}
				</div>
			</div>

			<div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-blue-200 mb-4">
				<img
					src={profilePicture}
					alt={mentor.name}
					className="object-cover w-full h-full"
					onError={(e) => {
						e.target.src = "/default-avatar.svg";
					}}
				/>
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

			<SkillsSection skills={mentor.skills} />
			<InterestsSection interests={mentor.interests} />
			<MatchScore score={score} />

			<div className="text-sm text-gray-600 mb-2">{mentor.points ?? 0} total points</div>

			<div className="flex gap-2">
				<a href={mentor.linked_in_url || "#"} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm transition-colors ${hasLinkedIn ? "" : "opacity-50 pointer-events-none"}`}>
					Connect
				</a>

				<button onClick={() => onToggleLike(mentor.id)} className={`px-4 py-2 rounded-full text-sm shadow-sm transition-colors ${isLiked ? "bg-red-400 hover:bg-red-500 text-white" : "bg-yellow-400 hover:bg-yellow-500 text-white"}`}>
					{isLiked ? "Unlike" : "Like"}
				</button>
			</div>
		</div>
	);
};

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
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!userId) return;
		fetchUserProfile();
	}, [userId]);

	useEffect(() => {
		if (!userProfile) return;
		fetchMentors();
	}, [userProfile, userId]);

	useEffect(() => {
		if (!userId || mentors.length === 0) return;
		fetchLikes();
	}, [userId, mentors]);

	useEffect(() => {
		if (!userProfile || mentors.length === 0) return;
		calculateTopMentors();
	}, [userProfile, mentors, likesMap, weights]);

	const fetchUserProfile = async () => {
		try {
			const { data, error } = await supabase.from("users").select("id, name, year, bio, skills, interests, ai_interest, experience_years, preferred_meeting, points, profile_picture").eq("id", userId).single();

			if (error) throw error;
			setUserProfile(data);
		} catch (err) {
			setError(err.message);
			console.error("Error fetching user profile:", err);
		}
	};

	const fetchMentors = async () => {
		try {
			const { data, error } = await supabase.from("users").select("*").ilike("mentor_role", "mentor").neq("id", userId);

			if (error) throw error;
			setMentors(data || []);
		} catch (err) {
			setError(err.message);
			console.error("Error fetching mentors:", err);
		}
	};

	const fetchLikes = async () => {
		try {
			const mentorIds = mentors.map((m) => m.id);
			const { data, error } = await supabase.from("interactions").select("to_user, weight").eq("type", "like").eq("from_user", userId).in("to_user", mentorIds);

			if (error) throw error;

			const map = {};
			data.forEach(({ to_user, weight }) => {
				map[to_user] = (map[to_user] || 0) + weight;
			});
			setLikesMap(map);
			setLikedMentors(new Set(Object.keys(map)));
		} catch (err) {
			console.error("Error fetching likes:", err);
		}
	};

	const calculateTopMentors = () => {
		try {
			const topN = Math.min(mentors.length, 6);
			const matches = getTopMentorMatches(userProfile, mentors, PRESET_SKILLS, PRESET_INTERESTS, likesMap, topN, weights);
			setTopMentors(matches);
			setLoading(false);
		} catch (err) {
			setError(err.message);
			console.error("Error calculating top mentors:", err);
			setLoading(false);
		}
	};

	const toggleLike = async (mentorId) => {
		if (!userId) return;

		try {
			const isLiked = likedMentors.has(mentorId);

			if (isLiked) {
				const { error } = await supabase.from("interactions").delete().eq("from_user", userId).eq("to_user", mentorId).eq("type", "like");

				if (error) throw error;

				setLikedMentors((prev) => {
					const next = new Set(prev);
					next.delete(mentorId);
					return next;
				});
				setLikesMap((prev) => {
					const { [mentorId]: _, ...rest } = prev;
					return rest;
				});
			} else {
				const { error } = await supabase.from("interactions").insert({
					from_user: userId,
					to_user: mentorId,
					type: "like",
					weight: 1,
				});

				if (error) throw error;

				setLikedMentors((prev) => new Set(prev).add(mentorId));
				setLikesMap((prev) => ({
					...prev,
					[mentorId]: (prev[mentorId] || 0) + 1,
				}));
			}
		} catch (err) {
			console.error("Error toggling like:", err);
		}
	};

	if (loading) return <LoadingSpinner />;

	if (error) {
		return (
			<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
				<NavigationBar />
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Mentors</h2>
						<p className="text-gray-700 mb-4">{error}</p>
						<button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<style>{`
				@keyframes pulse-glow {
					0%, 100% { box-shadow: 0 0 0 rgba(99, 102, 241, 0.3); }
					50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
				}
				.hover-pulse:hover { animation: pulse-glow 1.8s ease-in-out infinite; }
			`}</style>

			<NavigationBar />
			<Header onAdjustWeights={() => setShowWeightModal(true)} />

			<WeightModal weights={weights} setWeights={setWeights} isOpen={showWeightModal} onClose={() => setShowWeightModal(false)} />

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-8 py-6">
				{topMentors.length === 0 ? (
					<div className="col-span-full text-center py-8">
						<p className="text-gray-600 text-lg">No mentors available at the moment.</p>
					</div>
				) : (
					topMentors.map(({ mentor, score }) => <MentorCard key={mentor.id} mentor={mentor} score={score} userProfile={userProfile} isLiked={likedMentors.has(mentor.id)} onToggleLike={toggleLike} />)
				)}
			</div>

			<Footer />
		</div>
	);
}
