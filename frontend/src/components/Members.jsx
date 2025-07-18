import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";

export default function Members() {
	const [members, setMembers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");

	useEffect(() => {
		async function fetchMembers() {
			const { data, error } = await supabase.from("users").select("*");
			if (!error) setMembers(data);
			setLoading(false);
		}
		fetchMembers();
	}, []);

	const filtered = members.filter((m) => {
		const q = query.toLowerCase();
		return m.name?.toLowerCase().includes(q) || (m.skills && Object.keys(m.skills).some((s) => s.toLowerCase().includes(q))) || m.interests?.some((i) => i.toLowerCase().includes(q));
	});

	if (loading) return <LoadingSpinner />;

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen relative">
			<style>{`
        @keyframes pulse-glow {
          0%,100%{box-shadow:0 0 0 rgba(99,102,241,.3);}
          50%{box-shadow:0 0 20px rgba(99,102,241,.4);}
        }
        .hover-pulse:hover{animation:pulse-glow 1.8s ease-in-out infinite;}
      `}</style>
			<NavigationBar />
			<h1 className="text-5xl font-black text-center pt-12 text-gray-900 tracking-tight relative z-10">Member Directory</h1>
			<p className="text-center text-gray-600 mt-3 mb-10 text-lg font-semibold relative z-10">Connect with {members.length} amazing MICS members</p>

			<div className="flex justify-center mt-4">
				<input type="text" placeholder="Search by name, skill, or interest..." className="w-80 bg-white border border-gray-300 rounded px-3 py-2 shadow" value={query} onChange={(e) => setQuery(e.target.value)} />
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 m-10">
				{filtered.map((member) => {
					const pic = member.profile_picture || "https://picsum.photos/200/300";
					return (
						<div key={member.id} className="hover-pulse bg-white shadow-md rounded-lg p-6 flex flex-col items-center text-center transform transition duration-300 hover:scale-105 hover:ring-4 hover:ring-indigo-400 hover:ring-opacity-50 hover:ring-offset-4">
							<div className="w-20 h-20 rounded-full overflow-hidden mb-4">
								<img src={pic} alt={member.name} className="object-cover w-full h-full" />
							</div>
							<div className="text-lg font-semibold">{member.name}</div>
							<div className="text-sm text-gray-500">
								{member.year || "Year Unknown"} • {member.role || "Role Unknown"}
							</div>
							<div className="mt-2 text-sm">{member.bio || "No bio available."}</div>

							<div className="mt-3 w-full">
								<div className="font-semibold text-sm mb-1">Skills:</div>
								<div className="flex flex-wrap gap-2 justify-center">
									{Object.entries(member.skills || {}).map(([skill, level]) => (
										<span key={skill} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
											{skill} ({level})
										</span>
									))}
								</div>
							</div>

							<div className="mt-3 w-full">
								<div className="font-semibold text-sm mb-1">Interests:</div>
								<div className="flex flex-wrap gap-2 justify-center">
									{member.interests?.map((interest, i) => (
										<span key={i} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
											{interest}
										</span>
									))}
								</div>
							</div>

							<div className="mt-4 text-sm text-gray-600">{member.points ?? 0} points</div>
							<div className="mt-4 flex justify-center w-full">
								<a href={member.linked_in_url || "#"} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm ${member.linked_in_url ? "" : "opacity-50 pointer-events-none"}`}>
									Connect
								</a>
							</div>
						</div>
					);
				})}
			</div>
			<Footer />
		</div>
	);
}
