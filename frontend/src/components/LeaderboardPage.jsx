import React from "react";
import NavigationBar from "./NavigationBar.jsx";
import { Button } from "./ui/button";

const EventsPage = () => {
	return (
		<div className="p-6 max-w-7xl mx-auto">
			<NavigationBar/>

			<div className="bg-blue-400 py-2 px-4 rounded-lg shadow mb-6 w-fit mx-auto border border-gray-300">
				<h1 className="text-xl font-bold">MICS EVENTS SCHEDULE</h1>
			</div>
			<Events />
		</div>
	);
};

export default EventsPage;
