import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";

export default function DashboardPage() {
	const [points, setPoints] = useState(0);
	const [totalMembers, setTotalMembers] = useState(0);
	const [rank, setRank] = useState(0);
	const [topContributors, setTopContributors] = useState([]);
	const [featuredMembers, setFeaturedMembers] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		async function fetchData() {
			const { data: authData } = await supabase.auth.getUser();
			const user = authData?.user;
			if (!user) return;

			const { data: userData } = await supabase.from("users").select("points").eq("id", user.id).single();
			const pts = userData?.points ?? 0;
			setPoints(pts);

			const { count: membersCount } = await supabase.from("users").select("id", { count: "exact", head: true });
			setTotalMembers(membersCount || 0);

			const { count: higherCount } = await supabase.from("users").select("id", { count: "exact", head: true }).gt("points", pts);
			setRank((higherCount || 0) + 1);

			const { data: topData } = await supabase.from("users").select("id, name, year, points").order("points", { ascending: false }).limit(3);
			setTopContributors(topData || []);

			const { data: featured } = await supabase.from("users").select("id, name, year").order("created_at", { ascending: true }).limit(4);
			setFeaturedMembers(featured || []);
		}
		fetchData();
	}, []);

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<NavigationBar />

			<div className="text-center py-10">
				<h1 className="text-4xl font-bold mb-2">Welcome to MICS Connect!</h1>
				<p className="text-lg text-gray-700">Multicultural Innovators in Computer Science – Building community, fostering connections, and celebrating diversity in tech.</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto px-6 mb-10">
				<StatCard label="Your Points" value={points} />
				<StatCard label="Total Members" value={totalMembers} />
				<StatCard label="Your Rank" value={`#${rank}`} />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto px-6">
				<div className="bg-white rounded-lg p-6 shadow-md">
					<h2 className="text-xl font-semibold mb-2">Featured Members</h2>
					<p className="text-sm text-gray-600 mb-4">Meet a few awesome people from our community</p>
					{featuredMembers.map((member) => (
						<div key={member.id} className="bg-blue-100 rounded-lg p-4 mb-3">
							<div className="font-semibold text-gray-800">{member.name}</div>
							<div className="text-sm text-gray-600">Year: {member.year}</div>
						</div>
					))}
					<button onClick={() => navigate("/members")} className="w-full mt-4 bg-blue-500 text-white font-semibold py-2 rounded">
						View All Members
					</button>
				</div>

		
				<div className="bg-white rounded-lg p-6 shadow-md">
					<h2 className="text-xl font-semibold mb-2">Top Contributors</h2>
					<p className="text-sm text-gray-600 mb-4">Our most active community members</p>
					{topContributors.map((user, i) => (
						<div key={user.id} className="flex justify-between py-2 px-3 mb-1 bg-blue-100 rounded text-sm">
							<div>
								<span className="font-bold mr-2">{i + 1}</span>
								<span className="font-semibold text-gray-800">{user.name}</span>
								<span className="text-gray-600"> • {user.year}</span>
							</div>
							<div className="font-semibold text-blue-700">{user.points} pts</div>
						</div>
					))}
					<button onClick={() => navigate("/leaderboard")} className="w-full mt-4 bg-purple-500 text-white font-semibold py-2 rounded">
						View Leaderboard
					</button>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-6 mt-10">
				<div className="bg-white rounded-lg p-6 shadow-md">
					<h3 className="text-lg font-semibold">Our Mission</h3>
					<p className="text-sm text-gray-700 mt-2">MICS is dedicated to creating an inclusive and supportive community for underrepresented students in computer science. We foster connections, provide mentorship opportunities, and celebrate the diverse perspectives that make our field stronger. Together, we're building the next generation of tech leaders.</p>
				</div>
			</div>

			<div className="h-12" />
		</div>
	);
}

function StatCard({ label, value }) {
	return (
		<div className="bg-white text-gray-900 rounded-lg py-4 px-6 text-center shadow-md">
			<div className="text-2xl font-bold mt-2">{value}</div>
			<div className="text-sm mt-1">{label}</div>
		</div>
	);
}
