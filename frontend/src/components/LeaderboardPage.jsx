import React from "react";
import NavigationBar from "./NavigationBar.jsx";

const LeaderboardPage = () => {
	return (
		<div className="">
			<NavigationBar />
			<div className="bg-blue-400 py-2 px-4 rounded-lg shadow mb-6 w-fit mx-auto border border-gray-300">
				<h1 className="text-xl font-bold">MICS Leaderboard</h1>
			</div>
		</div>
	);
};

export default LeaderboardPage;
