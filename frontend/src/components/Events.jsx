import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useGoogleLogin } from "@react-oauth/google";
import { addEventToGoogleCalendar } from "../lib/googleCalendarUtils";
import AddEventModal from "./AddEventModal";

export default function Events({ role }) {
	const [events, setEvents] = useState([]);
	const [registered, setRegistered] = useState(new Set());
	const [userId, setUserId] = useState(null);
	const [points, setPoints] = useState(0);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);

	const [googleToken, setGoogleToken] = useState(null);

	const loginWithGoogleCalendar = useGoogleLogin({
		scope: "https://www.googleapis.com/auth/calendar.events",
		onSuccess: (tokenResponse) => {
			setGoogleToken(tokenResponse.access_token);
			alert("Google Calendar Connected!");
		},
		onError: (err) => {
			console.error("Google login failed:", err);
			alert("Failed to connect to Google Calendar");
		},
	});

	useEffect(() => {
		(async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;
			setUserId(user.id);

			// get registrations
			const { data: regData } = await supabase.from("event_registrations").select("event_id").eq("user_id", user.id);
			setRegistered(new Set(regData?.map((r) => r.event_id)));

			// get user points
			const { data: userData } = await supabase.from("users").select("points").eq("id", user.id).single();
			setPoints(userData?.points ?? 0);

			// fetch events INCLUDING their points
			const { data: eventData } = await supabase.from("events").select("id, title, description, location, date, points, users(name)").order("date", { ascending: true });
			setEvents(eventData ?? []);
			setLoading(false);
		})();
	}, []);

	const toggleRegister = async (id, eventPoints) => {
		if (!userId) return;
		const isReg = registered.has(id);

		if (isReg) {
			// unregister: subtract that event's points
			await supabase.from("event_registrations").delete().eq("user_id", userId).eq("event_id", id);
			await supabase
				.from("users")
				.update({ points: points - eventPoints })
				.eq("id", userId);
			setRegistered((prev) => {
				const s = new Set(prev);
				s.delete(id);
				return s;
			});
			setPoints((p) => p - eventPoints);
		} else {
			// register: add that event's points
			await supabase.from("event_registrations").insert([{ user_id: userId, event_id: id }]);
			await supabase
				.from("users")
				.update({ points: points + eventPoints })
				.eq("id", userId);
			setRegistered((prev) => new Set(prev).add(id));
			setPoints((p) => p + eventPoints);
		}
	};

	return (
		<div className="text-gray-900 min-h-screen">
			<div className="py-8 px-4 max-w-5xl mx-auto">
				{role === "Admin" && (
					<>
						<button onClick={() => setShowModal(true)} className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition">
							Add Event
						</button>
						{showModal && (
							<AddEventModal
								onClose={() => setShowModal(false)}
								onSubmit={async (newEvent) => {
									const { data, error } = await supabase
										.from("events")
										.insert([{ ...newEvent, created_by: userId }])
										.select()
										.single();
									if (!error && data) {
										setEvents((prev) => [...prev, data]);
									} else {
										console.error("Insert error:", error);
									}
								}}
							/>
						)}
					</>
				)}

				{loading ? (
					<p className="text-center text-gray-600">Loading events…</p>
				) : (
					<div className="space-y-6">
						{events.map((e) => {
							const isReg = registered.has(e.id);
							return (
								<div key={e.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
									<h2 className="text-xl font-semibold">{e.title}</h2>
									<div className="text-sm text-gray-600 mt-1">+{e.points} pts</div>
									<div className="text-gray-500 text-sm mt-1">
										{new Date(e.date).toLocaleString(undefined, {
											weekday: "short",
											year: "numeric",
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</div>
									<div className="text-gray-500 text-sm">{e.location}</div>
									<p className="mt-4 text-gray-700">{e.description}</p>
									<div className="mt-4 text-sm text-gray-600">
										Created by <span className="font-medium text-gray-800">{e.users?.name ?? "Unknown"}</span>
									</div>
									<div className="mt-6 flex gap-4">
										<button onClick={() => toggleRegister(e.id, e.points)} className={`text-sm font-medium py-2 px-4 rounded transition ${isReg ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}>
											{isReg ? "Registered" : "Register"}
										</button>
										<button
											onClick={() => {
												if (googleToken) {
													addEventToGoogleCalendar(googleToken, e);
												} else {
													loginWithGoogleCalendar();
												}
											}}
											className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded transition"
										>
											{googleToken ? "Add to Google Calendar" : "Connect Google Calendar"}
										</button>
									</div>
								</div>
							);
						})}
						<div className="text-right mt-6 text-sm text-gray-600 font-semibold">Total Points: {points}</div>
					</div>
				)}
			</div>
		</div>
	);
}
