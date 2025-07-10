import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import { getTopMentorMatches } from "../utils/mentorMatchUtils";
import { UserAuth } from "../context/AuthContext";
import { PRESET_SKILLS, PRESET_INTERESTS } from "./constants/presets";

export default function MentorPage() {
	const { session } = UserAuth();
	const [userProfile, setUserProfile] = useState(null);
	const [topMentors, setTopMentors] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!session?.user?.id) return;
		const fetchProfile = async () => {
			const { data, error } = await supabase.from("users").select("id, name, year, bio, skills, interests, ai_interest, experience_years, preferred_meeting, points, profile_picture").eq("id", session.user.id).single();
			if (error) {
				console.error("Error loading user profile:", error);
			} else {
				setUserProfile(data);
			}
		};
		fetchProfile();
	}, [session]);

	useEffect(() => {
		if (!userProfile) return;
		const fetchMentors = async () => {
			const { data, error } = await supabase.from("users").select("*").ilike("mentor_role", "mentor").neq("id", session.user.id);

			if (error) {
				console.error("Error fetching mentors:", error);
			} else {
				const matches = getTopMentorMatches(userProfile, data, PRESET_SKILLS, PRESET_INTERESTS, data.length < 6 ? data.length : 6);
				setTopMentors(matches);
			}
			setLoading(false);
		};
		fetchMentors();
	}, [userProfile, session]);

	if (loading) return <LoadingSpinner />;

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<NavigationBar />
			<h1 className="text-3xl font-bold text-center my-6">Mentor Matching</h1>
			<p className="text-center mb-10 text-gray-600">Browse featured mentors matched by interest & skills</p>

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
								<div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${Math.round(score * 100)}%` }}></div>
							</div>
							<div className="text-sm mt-1 text-blue-700 font-semibold">{Math.round(score * 100)}% match</div>
						</div>

						<div className="text-sm text-gray-600 mb-2">{mentor.points ?? 0} total points</div>

						<button className="mt-  2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm">Connect</button>
					</div>
				))}
			</div>
		</div>
	);
}
