import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import NavigationBar from "./NavigationBar";
import { Button } from "./ui/button";


const Dashboard = () => {
	const { session } = UserAuth();
	const [name, setName] = useState("");

	useEffect(() => {
		const fetchName = async () => {
			const userId = session?.user?.id;
			if (!userId) return;

			const { data, error } = await supabase.from("users").select("name").eq("id", userId).single();

			if (error) {
				console.error("Error fetching name:", error.message);
				return;
			}

			setName(data.name);
		};

		fetchName();
	}, [session]);
	return (
		<div>
			<NavigationBar />
			<h1>Dashboard</h1>
			<h2>Welcome, {name || "Guest"}</h2>
			<div>
				<Button className="ml-4">Login</Button>
			</div>
		</div>
	);
};

export default Dashboard;
