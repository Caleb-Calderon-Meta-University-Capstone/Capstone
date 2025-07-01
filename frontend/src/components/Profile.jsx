import React from "react";
import NavigationBar from "./NavigationBar.jsx";

const ProfilePage = () => {
	return (
		<div className="">
			<NavigationBar />
			<div className="bg-blue-400 py-2 px-4 rounded-lg shadow mb-6 w-fit mx-auto border border-gray-300">
				<h1 className="text-xl font-bold">Profile</h1>
			</div>
		</div>
	);
};

export default ProfilePage;
