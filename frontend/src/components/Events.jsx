// src/components/Events.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Events() {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadEvents() {
			setLoading(true);
			const { data, error } = await supabase.from("events").select("id,title,description,location,date,users(name)").order("date", { ascending: true });

			if (error) console.error("Error loading events:", error);
			else setEvents(data);

			setLoading(false);
		}
		loadEvents();
	}, []);

	return (
		<div className="text-gray-900 min-h-screen">
			<div className="py-8 px-4 max-w-5xl mx-auto">
				{loading ? (
					<p className="text-center text-gray-600">Loading events…</p>
				) : (
					<div className="space-y-6">
						{events.map((e) => (
							<div key={e.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
								<h2 className="text-xl font-semibold">{e.title}</h2>
								<div className="text-gray-500 text-sm mt-1">
									{new Date(e.date).toLocaleDateString(undefined, {
										weekday: "short",
										year: "numeric",
										month: "short",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
								<div className="text-gray-500 text-sm">{e.location}</div>
								<p className="mt-4 text-gray-700 flex-grow">{e.description}</p>
								<div className="mt-4 text-sm text-gray-600">
									Created by <span className="font-medium text-gray-800">{e.users?.name ?? "Unknown"}</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
