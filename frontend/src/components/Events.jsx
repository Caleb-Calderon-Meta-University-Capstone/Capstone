import React from "react";

//Todo: Delete this dummy data when integrating with backend
const dummyEvents = Array(30).fill();

const Events = () => {
	return (
		<div className="grid grid-cols-5 gap-4">
			{dummyEvents.map((event, index) => (
				<div key={index} className="h-40 bg-blue-400 p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-auto">
					<h2 className="text-lg font-semibold"> Event </h2>
					<p className="text-sm text-gray-700">Event details go here.</p>
				</div>
			))}
		</div>
	);
};

export default Events;
