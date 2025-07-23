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

			<div className="text-lg font-semibold text-gray-900">{member.name}</div>
			<div className="text-sm text-gray-500 flex items-center justify-center gap-2">
				{member.year || "Year Unknown"} • {member.role || "Role Unknown"}
				<span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{member.points ?? 0} pts</span>
			</div>
			<div className="mt-2 text-sm text-gray-700">{member.bio || "No bio available."}</div>

			<SkillsSection skills={member.skills} />
			<InterestsSection interests={member.interests} />

			<div className="mt-4 flex justify-center w-full">
				<a href={member.linked_in_url || "#"} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm transition-colors duration-200 flex items-center ${hasLinkedIn ? "" : "opacity-50 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
					<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
						<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
					</svg>
					Connect on LinkedIn
				</a>
			</div>
		</div>
	);
};

const SkillsSection = ({ skills }) => {
	if (!skills || Object.keys(skills).length === 0) {
		return (
			<div className="mt-3 w-full">
				<div className="font-semibold text-sm mb-1 text-gray-900">Skills:</div>
				<div className="text-xs text-gray-900">No skills listed</div>
			</div>
		);
	}

	return (
		<div className="mt-3 w-full">
			<div className="font-semibold text-sm mb-1 text-gray-900">Skills:</div>
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
				<div className="font-semibold text-sm mb-1 text-gray-900">Interests:</div>
				<div className="text-xs text-gray-900">No interests listed</div>
			</div>
		);
	}

	return (
		<div className="mt-3 w-full">
			<div className="font-semibold text-sm mb-1 text-gray-900">Interests:</div>
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

const SortDropdown = ({ sortBy, setSortBy, sortOrder, setSortOrder }) => (
	<div className="flex justify-center mt-4 gap-2">
		<select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-gray-300 rounded px-3 py-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900">
			<option value="name">Sort by Name</option>
			<option value="points">Sort by Points</option>
			<option value="year">Sort by Year</option>
			<option value="role">Sort by Role</option>
		</select>
		<select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-white border border-gray-300 rounded px-3 py-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900">
			<option value="asc">Ascending</option>
			<option value="desc">Descending</option>
		</select>
	</div>
);

const SearchAndSortControls = ({ query, setQuery, sortBy, setSortBy, sortOrder, setSortOrder }) => (
	<div className="flex justify-center mt-4 gap-2">
		<input type="text" placeholder="Search by name, skill, or interest..." className="w-80 bg-white border border-gray-300 rounded px-3 py-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900" value={query} onChange={(e) => setQuery(e.target.value)} />
		<select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-gray-300 rounded px-3 py-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900">
			<option value="name">Sort by Name</option>
			<option value="points">Sort by Points</option>
			<option value="year">Sort by Year</option>
			<option value="role">Sort by Role</option>
		</select>
		<select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-white border border-gray-300 rounded px-3 py-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900">
			<option value="asc">Ascending</option>
			<option value="desc">Descending</option>
		</select>
	</div>
);

const Header = ({ memberCount }) => (
	<div className="text-center pt-12">
		<div className="flex items-center justify-center mb-4">
			<img src="/MICS_Colorstack_Logo_Light.png" alt="MICS by ColorStack" className="h-16 w-auto mr-4" />
			<h1 className="text-5xl font-black text-center text-white tracking-tight relative z-10">Member Directory</h1>
		</div>
		<p className="text-center text-white mt-3 mb-10 text-lg font-semibold relative z-10">Connect with {memberCount} amazing MICS members</p>
	</div>
);

export default function Members() {
	const navigate = useNavigate();
	const [members, setMembers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [query, setQuery] = useState("");
	const [sortBy, setSortBy] = useState("name");
	const [sortOrder, setSortOrder] = useState("asc");
	const [currentPage, setCurrentPage] = useState(1);
	const membersPerPage = 12;

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

	const sortMembers = (list) => {
		const sorted = [...list];
		sorted.sort((a, b) => {
			let aValue, bValue;

			switch (sortBy) {
				case "name":
					aValue = a.name?.toLowerCase() || "";
					bValue = b.name?.toLowerCase() || "";
					break;
				case "points":
					aValue = a.points || 0;
					bValue = b.points || 0;
					break;
				case "year":
					aValue = a.year || "";
					bValue = b.year || "";
					break;
				case "role":
					aValue = a.role?.toLowerCase() || "";
					bValue = b.role?.toLowerCase() || "";
					break;
				default:
					aValue = a.name?.toLowerCase() || "";
					bValue = b.name?.toLowerCase() || "";
			}

			return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
		});

		return sorted;
	};

	const filteredMembers = sortMembers(
		members.filter((member) => {
			const searchQuery = query.toLowerCase();
			const nameMatch = member.name?.toLowerCase().includes(searchQuery);
			const skillsMatch = member.skills && Object.keys(member.skills).some((skill) => skill.toLowerCase().includes(searchQuery));
			const interestsMatch = member.interests?.some((interest) => interest.toLowerCase().includes(searchQuery));

			return nameMatch || skillsMatch || interestsMatch;
		})
	);

	const indexOfLastMember = currentPage * membersPerPage;
	const indexOfFirstMember = indexOfLastMember - membersPerPage;
	const currentMembers = filteredMembers.slice(indexOfFirstMember, indexOfLastMember);
	const totalPages = Math.ceil(filteredMembers.length / membersPerPage);

	useEffect(() => {
		setCurrentPage(1);
	}, [query]);

	if (loading) return <LoadingSpinner />;

	if (error) {
		return (
			<div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white min-h-screen">
				<NavigationBar />
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Members</h2>
						<p className="text-white mb-4">{error}</p>
						<button onClick={fetchMembers} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white min-h-screen relative flex flex-col">
			<style>{`
				@keyframes pulse-glow {
					0%, 100% { box-shadow: 0 0 0 rgba(99, 102, 241, 0.3); }
					50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
				}
				.hover-pulse:hover { animation: pulse-glow 1.8s ease-in-out infinite; }
			`}</style>

			<NavigationBar />
			<div className="flex-1">
				<Header memberCount={members.length} />
				<SearchAndSortControls query={query} setQuery={setQuery} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} />

				<div className="text-center mb-4 mt-4">
					<p className="text-white/90 font-medium">
						Showing {indexOfFirstMember + 1}-{Math.min(indexOfLastMember, filteredMembers.length)} of {filteredMembers.length} members
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 m-10">
					{currentMembers.length === 0 ? (
						<div className="col-span-full text-center py-8">
							<p className="text-white text-lg">{query ? `No members found matching "${query}"` : "No members available"}</p>
						</div>
					) : (
						currentMembers.map((member) => <MemberCard key={member.id} member={member} onClick={() => navigate(`/member/${member.id}`)} />)
					)}
				</div>

				{totalPages > 1 && (
					<div className="flex justify-center items-center gap-2 mb-8">
						<button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300">
							Previous
						</button>

						<div className="flex gap-1">
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
								const shouldShow = pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1;

								if (shouldShow) {
									return (
										<button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-2 rounded-lg font-medium transition-colors ${pageNum === currentPage ? "bg-indigo-600 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}>
											{pageNum}
										</button>
									);
								} else if ((pageNum === 2 && currentPage > 3) || (pageNum === totalPages - 1 && currentPage < totalPages - 2)) {
									return (
										<span key={pageNum} className="px-2 py-2 text-white/60">
											...
										</span>
									);
								}
								return null;
							})}
						</div>

						<button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300">
							Next
						</button>
					</div>
				)}
			</div>

			<Footer />
		</div>
	);
}
