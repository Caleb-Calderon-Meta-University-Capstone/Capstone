import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Heart, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";

export default function DashboardPage() {
	const [points, setPoints] = useState(0);
	const [totalMembers, setTotalMembers] = useState(0);
	const [rank, setRank] = useState(0);
	const [topContributors, setTopContributors] = useState([]);
	const [featuredEvents, setFeaturedEvents] = useState([]);
	const [loading, setLoading] = useState(true);
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

			const { data: topData } = await supabase.from("users").select("id, name, year, points, profile_picture").order("points", { ascending: false }).limit(3);
			setTopContributors(topData || []);

			const { data: events } = await supabase.from("events").select("id, title, date, location").order("date", { ascending: true }).limit(4);
			setFeaturedEvents(events || []);

			setLoading(false);
		}
		fetchData();
	}, []);

	if (loading) return <LoadingSpinner />;

	return (
		<div className="relative bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 min-h-screen overflow-hidden">
			<motion.div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-30" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity }} />
			<motion.div className="absolute -bottom-28 -right-28 w-72 h-72 bg-green-200 rounded-full filter blur-2xl opacity-25" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }} />

			<NavigationBar />

			<div className="relative z-10 max-w-7xl mx-auto px-6 py-20 space-y-20">
				<motion.header initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
					<h1 className="text-5xl sm:text-6xl font-extrabold text-gray-800 mb-4">
						Welcome to <span className="text-blue-600">MICS Connect</span>
					</h1>
					<p className="text-xl text-gray-700 max-w-3xl mx-auto">A vibrant hub for multicultural innovators in CS. Discover, connect, and grow with a community that celebrates you.</p>
				</motion.header>

				<section className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<StatCard icon={<Users className="w-8 h-8 text-blue-600" />} label="Members" value={totalMembers} delay={0.2} />
					<StatCard icon={<Heart className="w-8 h-8 text-red-500" />} label="Your Points" value={points} delay={0.4} />
					<StatCard icon={<Trophy className="w-8 h-8 text-yellow-500" />} label="Your Rank" value={`#${rank}`} delay={0.6} />
				</section>

				<section className="space-y-6">
					<div className="flex flex-col md:flex-row items-center justify-center md:justify-between space-y-4 md:space-y-0">
						<h2 className="text-3xl font-semibold text-gray-800 flex items-center">
							<Calendar className="w-6 h-6 text-blue-600 mr-2" />
							Featured Events
						</h2>
						<button onClick={() => navigate("/events")} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
							View All Events
						</button>
					</div>
					<div className="flex justify-center space-x-6 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
						{featuredEvents.map((event, idx) => (
							<motion.div key={event.id} className="snap-start bg-white rounded-2xl shadow-xl p-6 w-64 flex flex-col justify-between" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2, type: "spring" }} whileHover={{ scale: 1.05 }}>
								<div>
									<h3 className="text-lg font-bold text-gray-800 mb-2">{event.title}</h3>
									<p className="text-sm text-gray-500 mb-2">{new Date(event.date).toLocaleDateString()}</p>
									<p className="text-sm text-gray-600">{event.location}</p>
								</div>
								<button onClick={() => navigate("/events")} className="mt-4 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition">
									More Details
								</button>
							</motion.div>
						))}
					</div>
				</section>

				<section className="space-y-6">
					<h2 className="text-3xl font-semibold text-gray-800">Top Contributors</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
						{topContributors.map((user, idx) => (
							<motion.div key={user.id} className="bg-white rounded-2xl shadow-2xl p-6 flex items-center justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.2 }}>
								<div className="flex items-center space-x-4">
									<span className="text-xl font-bold text-blue-600">{idx + 1}</span>
									<img src={user.profile_picture} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
									<div>
										<h3 className="font-semibold text-gray-800">{user.name}</h3>
										<p className="text-sm text-gray-500">Year: {user.year}</p>
									</div>
								</div>
								<div className="text-xl font-bold text-blue-700">{user.points} pts</div>
							</motion.div>
						))}
					</div>
				</section>

				<motion.section className="relative p-8 bg-white bg-opacity-90 rounded-2xl shadow-inner overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
					<div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 mix-blend-multiply" />
					<div className="relative z-10">
						<h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h3>
						<p className="text-gray-800 leading-relaxed"> Multicultural Innovators in Computer Sciences fosters an inclusive community that empowers individuals from diverse backgrounds to excel in the computer sciences. Through mentorship, collaboration, and innovation, we aim to inspire change and promote diversity in the tech industry.</p>
					</div>
				</motion.section>
			</div>
			<Footer />
		</div>
	);
}

function StatCard({ icon, label, value, delay }) {
	return (
		<motion.div className="bg-white rounded-2xl shadow-xl flex items-center p-6 space-x-4 transform transition hover:-translate-y-1 hover:shadow-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
			<div>{icon}</div>
			<div>
				<div className="text-xl font-bold text-gray-900">{value}</div>
				<div className="text-sm text-gray-500">{label}</div>
			</div>
		</motion.div>
	);
}
