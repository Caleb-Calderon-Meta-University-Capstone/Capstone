import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";

export default function Leaderboard() {
	const [users, setUsers] = useState([]);

	useEffect(() => {
		supabase
			.from("users")
			.select("*")
			.order("points", { ascending: false })
			.then(({ data, error }) => {
				if (error) console.error(error);
				else setUsers(data);
			});
	}, []);

	const topThree = users.slice(0, 3);

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900">
			<NavigationBar />
			<h1 className="text-4xl font-bold text-center pt-10">MICS Leaderboard</h1>
			<p className="text-center text-gray-700 mt-2 mb-8">Celebrating our most active community members</p>

			<div className="flex flex-wrap justify-center gap-6 px-4">
				{topThree.map((u, i) => (
					<div
						key={u.id}
						className="relative bg-white rounded-lg shadow-md p-6 w-60 text-center
                    before:absolute before:-inset-1.5 before:rounded-lg
                    before:bg-gradient-radial before:from-red-400 before:to-transparent
                    before:filter before:blur-md before:-z-10"
					>
						<div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full bg-gray-200">
							<img src={u.profile_picture || "https://via.placeholder.com/80"} alt={u.name} className="h-full w-full object-cover" />
						</div>
						<h2 className="text-lg font-bold animate-flame-glow">{u.name}</h2>
						<p className="mt-1 text-sm text-gray-600">{u.year}</p>
						<p className="mt-2 text-xl font-semibold">{u.points} points</p>
						<p className="mt-1 text-xs text-gray-500">#{i + 1}</p>
					</div>
				))}
			</div>

			<div className="mx-auto mt-10 max-w-3xl rounded-lg bg-white p-6 shadow-md">
				<h3 className="mb-4 text-center text-2xl font-semibold">Full Rankings</h3>
				{users.map((u, i) => (
					<div key={u.id} className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white font-bold">{i + 1}</div>
							<div>
								<p className="font-semibold animate-flame-glow">{u.name}</p>
								<p className="text-xs text-gray-600">{u.year}</p>
							</div>
						</div>
						<div className="mx-4 flex-1 overflow-hidden rounded-full bg-blue-200  h-2">
							<div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: `${(u.points / users[0]?.points) * 100}%` }} />
						</div>
						<p className="w-16 text-right text-sm font-semibold">{u.points} pts</p>
					</div>
				))}
			</div>
		</div>
	);
}
