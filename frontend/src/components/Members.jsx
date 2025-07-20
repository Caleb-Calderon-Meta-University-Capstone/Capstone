import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";

const MemberCard = ({ member, onClick }) => {
	const profilePicture = member.profile_picture || "/default-avatar.svg";
	const hasLinkedIn = member.linked_in_url && member.linked_in_url !== "#";

	return (
		<div className="hover-pulse bg-white shadow-md rounded-lg p-6 flex flex-col items-center text-center transform transition duration-300 hover:scale-105 hover:ring-4 hover:ring-indigo-400 hover:ring-opacity-50 hover:ring-offset-4 cursor-pointer" onClick={onClick}>
			<div className="w-20 h-20 rounded-full overflow-hidden mb-4">
				<img
					src={profilePicture}
					alt={member.name}
					className="object-cover w-full h-full"
					onError={(e) => {
						e.target.src = "/default-avatar.svg";
					}}
				/>
			</div>

			<div className="text-lg font-semibold">{member.name}</div>
			<div className="text-sm text-gray-500">
				{member.year || "Year Unknown"} • {member.role || "Role Unknown"}
			</div>
			<div className="mt-2 text-sm">{member.bio || "No bio available."}</div>

			<SkillsSection skills={member.skills} />
			<InterestsSection interests={member.interests} />

			<div className="mt-4 text-sm text-gray-600">{member.points ?? 0} points</div>

			<div className="mt-4 flex justify-center w-full">
				<a href={member.linked_in_url || "#"} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm transition-colors duration-200 ${hasLinkedIn ? "" : "opacity-50 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
					Connect
				</a>
			</div>
		</div>
	);
};

const SkillsSection = ({ skills }) => {
	if (!skills || Object.keys(skills).length === 0) {
		return (
			<div className="mt-3 w-full">
				<div className="font-semibold text-sm mb-1">Skills:</div>
				<div className="text-xs text-gray-500">No skills listed</div>
			</div>
		);
	}

	return (
		<div className="mt-3 w-full">
			<div className="font-semibold text-sm mb-1">Skills:</div>
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
			<div className="mt-3 w-full">
				<div className="font-semibold text-sm mb-1">Interests:</div>
				<div className="text-xs text-gray-500">No interests listed</div>
			</div>
		);
	}

	return (
		<div className="mt-3 w-full">
			<div className="font-semibold text-sm mb-1">Interests:</div>
			<div className="flex flex-wrap gap-2 justify-center">
				{interests.map((interest, index) => (
					<span key={index} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
						{interest}
					</span>
				))}
			</div>
		</div>
	);
};

const SearchInput = ({ query, setQuery }) => (
	<div className="flex justify-center mt-4">
		<input type="text" placeholder="Search by name, skill, or interest..." className="w-80 bg-white border border-gray-300 rounded px-3 py-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" value={query} onChange={(e) => setQuery(e.target.value)} />
	</div>
);

const Header = ({ memberCount }) => (
	<div className="text-center pt-12">
		<div className="flex items-center justify-center mb-4">
			<img src="/MICS_Colorstack_Logo.png" alt="MICS by ColorStack" className="h-16 w-auto mr-4" />
			<h1 className="text-5xl font-black text-center text-gray-900 tracking-tight relative z-10">Member Directory</h1>
		</div>
		<p className="text-center text-gray-600 mt-3 mb-10 text-lg font-semibold relative z-10">Connect with {memberCount} amazing MICS members</p>
	</div>
);

export default function Members() {
	const navigate = useNavigate();
	const [members, setMembers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [query, setQuery] = useState("");

	useEffect(() => {
		fetchMembers();
	}, []);

	const fetchMembers = async () => {
		try {
			setLoading(true);
			setError(null);

			const { data, error: supabaseError } = await supabase.from("users").select("*");

			if (supabaseError) {
				throw new Error(supabaseError.message);
			}

			setMembers(data || []);
		} catch (err) {
			setError(err.message);
			console.error("Error fetching members:", err);
		} finally {
			setLoading(false);
		}
	};

	const filteredMembers = members.filter((member) => {
		const searchQuery = query.toLowerCase();
		const nameMatch = member.name?.toLowerCase().includes(searchQuery);
		const skillsMatch = member.skills && Object.keys(member.skills).some((skill) => skill.toLowerCase().includes(searchQuery));
		const interestsMatch = member.interests?.some((interest) => interest.toLowerCase().includes(searchQuery));

		return nameMatch || skillsMatch || interestsMatch;
	});

	if (loading) return <LoadingSpinner />;

	if (error) {
		return (
			<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
				<NavigationBar />
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Members</h2>
						<p className="text-gray-700 mb-4">{error}</p>
						<button onClick={fetchMembers} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen relative">
			<style>{`
				@keyframes pulse-glow {
					0%, 100% { box-shadow: 0 0 0 rgba(99, 102, 241, 0.3); }
					50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
				}
				.hover-pulse:hover { animation: pulse-glow 1.8s ease-in-out infinite; }
			`}</style>

			<NavigationBar />
			<Header memberCount={members.length} />
			<SearchInput query={query} setQuery={setQuery} />

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 m-10">
				{filteredMembers.length === 0 ? (
					<div className="col-span-full text-center py-8">
						<p className="text-gray-600 text-lg">{query ? `No members found matching "${query}"` : "No members available"}</p>
					</div>
				) : (
					filteredMembers.map((member) => <MemberCard key={member.id} member={member} onClick={() => navigate(`/member/${member.id}`)} />)
				)}
			</div>

			<Footer />
		</div>
	);
}
