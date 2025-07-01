import React from "react";
import { UserAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./NavigationBar.jsx";
import { Button } from "./ui/button";

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
			<NavigationBar />
			<h1> Dashbord</h1>
			<h2> Welcome, {session?.user?.email} </h2>
			<div>
				<Button className="ml-4">Login</Button>
			</div>
		</div>
	);
};

export default Dashboard;
