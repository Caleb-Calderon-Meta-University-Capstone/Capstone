import React from "react";
import EventsList from "./Events.jsx";
import NavigationBar from "./NavigationBar.jsx";
import { Button } from "./ui/button";

const EventsPage = () => {
	return (
		<div className="mx-auto">
			<NavigationBar />

			<div className="bg-blue-400 py-2 px-4 rounded-lg shadow mb-6 w-fit mx-auto border border-gray-300">
				<h1 className="text-xl font-bold">MICS EVENTS SCHEDULE</h1>
			</div>
			<EventsList />
		</div>
	);
};

export default EventsPage;
