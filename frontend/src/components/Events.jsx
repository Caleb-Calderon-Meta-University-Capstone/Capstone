import React from "react";

const eventsData = [
	{
		id: 1,
		title: "MICS Weekly Meeting",
		date: "Thu, Feb 15",
		time: "10:00 AM",
		location: "IST Building Room 110",
		description: "Weekly meeting to discuss upcoming events and initiatives. Join us for updates on club activities, networking opportunities, and planning sessions.",
		organizedBy: "Sophia Rodriguez",
	},
	{
		id: 2,
		title: "Resume Workshop with Industry Professionals",
		date: "Tue, Feb 20",
		time: "9:00 AM",
		location: "Career Services Center",
		description: "Learn how to craft a compelling tech resume with industry professionals from Google, Microsoft, and local startups. Get personalized feedback on your resume.",
		organizedBy: "Daniel Kim",
	},
	{
		id: 3,
		title: "Coding Interview Prep Session",
		date: "Sun, Feb 25",
		time: "11:00 AM",
		location: "Virtual – Zoom",
		description: "Practice coding interviews with upper‐classmen mentors. Work through real interview questions from FAANG companies and get tips on problem‐solving strategies.",
		organizedBy: "Sophia Rodriguez",
	},
	{
		id: 4,
		title: "Hackathon: Build for Social Good",
		date: "Fri, Mar 1",
		time: "1:00 AM",
		location: "Innovation Hub – Westgate",
		description: "48-hour hackathon focused on creating technology solutions for social impact. Teams will work on projects addressing community challenges with mentorship from industry experts.",
		organizedBy: "Daniel Kim",
	},
	{
		id: 5,
		title: "Women in Tech Panel Discussion",
		date: "Tue, Mar 5",
		time: "10:30 AM",
		location: "Thomas Building Auditorium",
		description: "Join leading women in tech as they share their career journeys, challenges, and advice for breaking into the industry. Q&A to follow.",
		organizedBy: "Alex Lee",
	},
];

export default function Events() {
	return (
		<div className="max-w-5xl mx-auto py-12 px-4">
			<div className="space-y-6">
				{eventsData.map((e) => (
					<div key={e.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
						<h2 className="text-xl font-semibold">{e.title}</h2>
						<div className="text-gray-500 text-sm mt-1">
							{e.date} • {e.time}
						</div>
						<div className="text-gray-500 text-sm">{e.location}</div>
						<p className="mt-4 text-gray-700 flex-grow">{e.description}</p>
						<div className="mt-4 text-sm text-gray-600">
							Created by <span className="font-medium text-gray-800">{e.organizedBy}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
