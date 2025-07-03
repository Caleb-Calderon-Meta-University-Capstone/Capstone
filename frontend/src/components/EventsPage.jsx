// src/components/EventsPage.jsx
import React from "react";
import NavigationBar from "./NavigationBar";
import Events from "./Events";

export default function EventsPage() {
	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<NavigationBar active="events" />

			<div className="py-8 px-4">
				<div className="py-2 px-6 w-fit mx-auto">
					<h1 class="text-3xl font-bold text-center">MICS Events Schedule</h1>
				</div>

				<Events />
			</div>
		</div>
	);
}
