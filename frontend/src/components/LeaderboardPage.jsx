import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";

export default function LeaderboardPage() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		supabase
			.from("users")
			.select("*")
			.order("points", { ascending: false })
			.then(({ data, error }) => {
				if (error) {
					console.error(error);
				} else {
					setUsers(data);
				}
				setLoading(false);
			});
	}, []);

	const topThree = users.slice(0, 3);

	if (loading) return <LoadingSpinner />;

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 font-sans text-black relative overflow-hidden">
			<NavigationBar />

			<style>{`
				@keyframes lavaFlow {
					0% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
					100% { background-position: 0% 50%; }
				}
				@keyframes moltenGlow {
					0%, 100% { opacity: 0.2; }
					50% { opacity: 0.4; }
				}
				.lava-bar {
					background-image: linear-gradient(90deg, #ff3c00, #ff6b00, #ffa500, #ff3c00);
					background-size: 300% 100%;
					animation: lavaFlow 3s ease-in-out infinite;
					border-radius: 9999px;
				}
				.glow-fire {
					background-color: white
				}
				.glow-fire-sm {
					background-color: white;
				}
				.glow-fire-xs {
					background-color: white;
				}
			`}</style>

			<h1 className="text-5xl font-black text-center pt-12 text-gray-900 tracking-tight relative z-10">MICS Leaderboard</h1>
			<p className="text-center text-gray-600 mt-3 mb-10 text-lg font-semibold relative z-10">Celebrating the most engaged and impactful members of our community</p>

			<div className="flex flex-wrap justify-center gap-6 px-4 relative z-10">
				{topThree.map((u, i) => (
					<div key={u.id} className={`relative rounded-lg p-6 w-64 text-center border border-black ${i === 0 ? "glow-fire" : i === 1 ? "glow-fire-sm" : "glow-fire-xs"}`}>
						<div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full bg-gray-300 border-2 border-orange-300">
							<img src={u.profile_picture || "https://via.placeholder.com/80"} alt={u.name} className="h-full w-full object-cover" />
						</div>
						<h2 className="text-lg font-extrabold text-black">{u.name}</h2>
						<p className="mt-1 text-sm text-gray-700 font-medium">{u.year}</p>
						<p className="mt-2 text-xl font-extrabold text-orange-600">{u.points} pts</p>
						<p className="mt-1 text-xs text-gray-600 font-semibold">#{i + 1}</p>
					</div>
				))}
			</div>

			<div className="mx-auto my-12 max-w-3xl rounded-lg bg-white/90 p-6 shadow-md border border-orange-300 relative z-10">
				<h3 className="mb-6 text-center text-2xl font-extrabold text-black"> Full Rankings </h3>
				{users.map((u, i) => (
					<div key={u.id} className="mb-5 flex items-center gap-4">
						<div className="h-8 w-8 flex items-center justify-center rounded-full bg-orange-500 font-bold text-white">{i + 1}</div>
						<div className="min-w-[80px]">
							<p className="font-bold text-black">{u.name}</p>
							<p className="text-xs text-gray-700">{u.year}</p>
						</div>
						<div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden relative">
							<div className="h-full lava-bar" style={{ width: `${(u.points / (users[0]?.points || 1)) * 100}%` }} />
						</div>
						<p className="w-20 text-right font-semibold text-orange-600">{u.points} pts</p>
					</div>
				))}
			</div>
			<Footer />
		</div>
	);
}
