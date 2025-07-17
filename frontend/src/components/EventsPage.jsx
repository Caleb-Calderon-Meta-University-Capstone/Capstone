import React, { useEffect, useState } from "react";
import NavigationBar from "./NavigationBar";
import Events from "./Events";
import { supabase } from "../supabaseClient";
import Footer from "./Footer";

export default function EventsPage() {
	const [role, setRole] = useState(null);

	useEffect(() => {
		(async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();

			setRole(userData?.role ?? "Member");
		})();
	}, []);

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<NavigationBar active="events" />
			<div className="py-12 px-4">
				<div className="w-fit mx-auto text-center">
					<h1 className="text-5xl font-black text-center text-gray-900 tracking-tight relative z-10">MICS Events Schedule</h1>
					<p className="text-center text-gray-600 mt-3 mb-10 text-lg font-semibold relative z-10">Stay connected with upcoming events, workshops, and networking opportunities</p>
				</div>

				<div>
					<Events role={role} />
				</div>
			</div>
			<Footer />
		</div>
	);
}
