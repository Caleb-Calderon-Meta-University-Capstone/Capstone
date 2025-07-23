import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";

const SkillsSection = ({ skills }) => {
	if (!skills || Object.keys(skills).length === 0) {
		return (
			<div className="mt-6">
				<div className="font-semibold text-lg mb-3">Skills:</div>
				<div className="text-gray-500">No skills listed</div>
			</div>
		);
	}

	return (
		<div className="mt-6">
			<div className="font-semibold text-lg mb-3">Skills:</div>
			<div className="flex flex-wrap gap-3">
				{Object.entries(skills).map(([skill, level]) => (
					<span key={skill} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
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
			<div className="mt-6">
				<div className="font-semibold text-lg mb-3">Interests:</div>
				<div className="text-gray-500">No interests listed</div>
			</div>
		);
	}

	return (
		<div className="mt-6">
			<div className="font-semibold text-lg mb-3">Interests:</div>
			<div className="flex flex-wrap gap-3">
				{interests.map((interest, index) => (
					<span key={index} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
						{interest}
					</span>
				))}
			</div>
		</div>
	);
};

export default function MemberCardPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [member, setMember] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchMember();
	}, [id]);

	const fetchMember = async () => {
		try {
			setLoading(true);
			setError(null);

			const { data, error: supabaseError } = await supabase.from("users").select("*").eq("id", id).single();

			if (supabaseError) {
				throw new Error(supabaseError.message);
			}

			if (!data) {
				throw new Error("Member not found");
			}

			setMember(data);
		} catch (err) {
			setError(err.message);
			console.error("Error fetching member:", err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <LoadingSpinner />;

	if (error) {
		return (
			<div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white min-h-screen">
				<NavigationBar />
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Member</h2>
						<p className="text-white mb-4">{error}</p>
						<div className="space-x-4">
							<button onClick={fetchMember} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">
								Try Again
							</button>
							<button onClick={() => navigate("/members")} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
								Back to Members
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const profilePicture = member.profile_picture || "/default-avatar.svg";
	const hasLinkedIn = member.linked_in_url && member.linked_in_url !== "#";

	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-gray-900">
			<NavigationBar />
			<div className="flex-1">
				<div className="max-w-4xl mx-auto px-6 py-12">
					<button onClick={() => navigate("/members")} className="mb-8 flex items-center text-white hover:text-gray-200 transition-colors">
						<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						Back to Members
					</button>

					<div className="bg-white rounded-2xl shadow-xl p-8">
						<div className="flex flex-col md:flex-row items-center md:items-start gap-8">
							<div className="flex-shrink-0">
								<div className="w-48 h-48 rounded-full overflow-hidden shadow-lg">
									<img
										src={profilePicture}
										alt={member.name}
										className="object-cover w-full h-full"
										onError={(e) => {
											e.target.src = "/default-avatar.svg";
										}}
									/>
								</div>
							</div>

							<div className="flex-1 text-center md:text-left">
								<h1 className="text-4xl font-bold text-gray-900 mb-2">{member.name}</h1>
								<div className="text-xl text-gray-600 mb-4 flex items-center gap-2">
									{member.year || "Year Unknown"} • {member.role || "Role Unknown"}
									<span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{member.points ?? 0} pts</span>
								</div>

								<div className="text-lg text-gray-700 mb-6 leading-relaxed">{member.bio || "No bio available."}</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
									<div className="bg-blue-50 rounded-lg p-4">
										<div className="text-sm text-gray-500 font-semibold mb-1">Mentorship Role</div>
										<div className="text-base text-gray-900">{member.mentor_role || "N/A"}</div>
									</div>
									<div className="bg-blue-50 rounded-lg p-4">
										<div className="text-sm text-gray-500 font-semibold mb-1">Years of Experience</div>
										<div className="text-base text-gray-900">{member.experience_years || "N/A"}</div>
									</div>
									<div className="bg-blue-50 rounded-lg p-4">
										<div className="text-sm text-gray-500 font-semibold mb-1">Interested in AI?</div>
										<div className="text-base text-gray-900">{member.ai_interest === true ? "Yes" : member.ai_interest === false ? "No" : "N/A"}</div>
									</div>
									<div className="bg-blue-50 rounded-lg p-4">
										<div className="text-sm text-gray-500 font-semibold mb-1">Preferred Meeting Type</div>
										<div className="text-base text-gray-900">{member.preferred_meeting || "N/A"}</div>
									</div>
								</div>

								<div className="flex gap-2 mb-6">
									<a href={member.linked_in_url || "#"} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-medium transition-colors duration-200 ${hasLinkedIn ? "" : "opacity-50 pointer-events-none"}`}>
										<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
											<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
										</svg>
										Connect on LinkedIn
									</a>
								</div>
							</div>
						</div>

						<div className="mt-8 pt-8 border-t border-gray-200">
							<SkillsSection skills={member.skills} />
							<InterestsSection interests={member.interests} />
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
}
