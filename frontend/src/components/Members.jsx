import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";

export default function Members() {
	const [members, setMembers] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchMembers() {
			const { data, error } = await supabase.from("users").select("*");
			if (error) {
				console.error("Error fetching members:", error);
			} else {
				setMembers(data);
			}
			setLoading(false);
		}
		fetchMembers();
	}, []);

	if (loading) return <LoadingSpinner />;

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<NavigationBar />
			<h1 className="text-3xl font-bold text-center my-6">Member Directory</h1>
			<p className="text-center mb-10 text-gray-600">Connect with {members.length} amazing MICS members</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 m-10">
				{members.map((member) => {
					const profilePicture = member.profile_picture || "https://picsum.photos/200/300";
					return (
						<div key={member.id} className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center text-center">
							<div className="w-20 h-20 rounded-full overflow-hidden mb-4">
								<img src={profilePicture} alt={member.name} className="object-cover w-full h-full" />
							</div>
							<div className="text-lg font-semibold">{member.name}</div>
							<div className="text-sm text-gray-500">
								{member.year || "Year Unknown"} • {member.role || "Role Unknown"}
							</div>
							<div className="mt-2 text-sm">{member.bio || "No bio available."}</div>
							<div className="mt-3 w-full">
								<div className="font-semibold text-sm mb-1">Skills:</div>
								<div className="flex flex-wrap gap-2 justify-center">
									{member.skills?.map((skill, i) => (
										<span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
											{skill}
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
						</div>
					);
				})}
			</div>
		</div>
	);
}
