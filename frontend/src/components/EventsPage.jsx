import React, { useEffect, useState } from "react";
import NavigationBar from "./NavigationBar";
import Events from "./Events";
import { supabase } from "../supabaseClient";

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

			<div className="py-8 px-4">
				<div className="py-2 px-6 w-fit mx-auto">
					<h1 className="text-3xl font-bold text-center">MICS Events Schedule</h1>
				</div>

				<Events role={role} />
			</div>
		</div>
	);
}
