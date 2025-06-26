import React from "react";
import { UserAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
	const { session, signOut } = UserAuth();
	const navigate = useNavigate();

	const handleSignOut = async (e) => {
		e.preventDefault();
		try {
			await signOut();
			navigate("/");
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	return (
		<div>
			<h1> Dashbord</h1>
			<h2> Welcome, {session?.user?.email} </h2>
			<div>
				<button onClick={handleSignOut} className="hover:cursor-pointer border incline-block px-2 py-3 m-5 bg-blue-500 w-20">
					Sign out
				</button>
			</div>
		</div>
	);
};

export default Dashboard;
