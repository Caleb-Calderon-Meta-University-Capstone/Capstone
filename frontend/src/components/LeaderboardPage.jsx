import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";
import "../styles/leaderboard.css";

export default function LeaderboardPage() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const usersPerPage = 10;

	const fetchUsers = useCallback(async () => {
		try {
			const { data, error } = await supabase.from("users").select("*").order("points", { ascending: false });

			if (error) {
				console.error("Error fetching users:", error);
			} else {
				setUsers(data || []);
			}
		} catch (error) {
			console.error("Unexpected error:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const topThree = useMemo(() => users.slice(0, 3), [users]);
	const maxPoints = useMemo(() => users[0]?.points || 1, [users]);

	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
	const totalPages = Math.ceil(users.length / usersPerPage);

	useEffect(() => {
		setCurrentPage(1);
	}, [users.length]);

	const getGlowClass = (index) => {
		if (index === 0) return "glow-fire";
		if (index === 1) return "glow-fire-sm";
		return "glow-fire-xs";
	};

	if (loading) return <LoadingSpinner />;

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 font-sans text-white relative overflow-hidden flex flex-col">
			<NavigationBar />

			<div className="flex-1">
				<div className="text-center pt-12">
					<div className="flex items-center justify-center mb-4">
						<img src="/MICS_Colorstack_Logo_Light.png" alt="MICS by ColorStack" className="h-16 w-auto mr-4" />
						<h1 className="text-5xl font-black text-center text-white tracking-tight relative z-10">MICS Leaderboard</h1>
					</div>
					<p className="text-center text-white mt-3 mb-10 text-lg font-semibold relative z-10">Celebrating the most engaged and impactful members of our community</p>
				</div>

				<div className="flex flex-wrap justify-center gap-6 px-4 relative z-10">
					{topThree.map((user, index) => (
						<div key={user.id} className={`relative rounded-lg p-6 w-64 text-center border border-white ${getGlowClass(index)}`}>
							<div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full bg-gray-300 border-2 border-gray-400">
								<img src={user.profile_picture || "https://via.placeholder.com/80"} alt={user.name} className="h-full w-full object-cover" />
							</div>
							<h2 className="text-lg font-extrabold text-black">{user.name}</h2>
							<p className="mt-1 text-sm text-gray-700 font-medium">{user.year}</p>
							<p className="mt-2 text-xl font-extrabold text-indigo-600">{user.points} pts</p>
							<p className="mt-1 text-xs text-gray-600 font-semibold">#{index + 1}</p>
						</div>
					))}
				</div>

				<div className="mx-auto my-12 max-w-3xl rounded-lg bg-white/90 p-6 shadow-md border border-indigo-300 relative z-10">
					<h3 className="mb-6 text-center text-2xl font-extrabold text-gray-900">Full Rankings</h3>

					<div className="mb-6 text-center">
						<p className="text-gray-600 font-medium">
							Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, users.length)} of {users.length} members
						</p>
					</div>

					{currentUsers.map((user, index) => {
						const globalIndex = indexOfFirstUser + index;
						return (
							<div key={user.id} className="mb-5 flex items-center gap-4">
								<div className="flex-shrink-0 w-12 h-8 flex items-center justify-center rounded-full bg-indigo-500 font-bold text-white">{globalIndex + 1}</div>

								<div className="flex-shrink-0 w-48">
									<p className="font-bold text-gray-900 truncate">{user.name}</p>
									<p className="text-xs text-gray-700">{user.year}</p>
								</div>

								<div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden relative">
									<div className="h-full lava-bar" style={{ width: `${(user.points / maxPoints) * 100}%` }} />
								</div>

								<div className="flex-shrink-0 w-24 text-right">
									<p className="font-semibold text-indigo-600">{user.points} pts</p>
								</div>
							</div>
						);
					})}

					{totalPages > 1 && (
						<div className="mt-8 flex justify-center items-center gap-2">
							<button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300">
								Previous
							</button>

							<div className="flex gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
									const shouldShow = pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1;

									if (shouldShow) {
										return (
											<button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-2 rounded-lg font-medium transition-colors ${pageNum === currentPage ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
												{pageNum}
											</button>
										);
									} else if ((pageNum === 2 && currentPage > 3) || (pageNum === totalPages - 1 && currentPage < totalPages - 2)) {
										return (
											<span key={pageNum} className="px-2 py-2 text-gray-500">
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
			</div>
			<Footer />
		</div>
	);
}
