import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useGoogleLogin } from "@react-oauth/google";
import { addEventToGoogleCalendar } from "../lib/googleCalendarUtils";
import AddEventModal from "./AddEventModal";
import LoadingSpinner from "./LoadingSpinner";

export default function Events({ role }) {
	const [events, setEvents] = useState([]);
	const [registered, setRegistered] = useState(new Set());
	const [userId, setUserId] = useState(null);
	const [points, setPoints] = useState(0);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [submitting, setsSubmitting] = useState(false);

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
			if (!user) {
				setLoading(false);
				return;
			}
			setUserId(user.id);

			const { data: regData } = await supabase.from("event_registrations").select("event_id").eq("user_id", user.id);
			setRegistered(new Set(regData?.map((r) => r.event_id)));

			const { data: userData } = await supabase.from("users").select("points").eq("id", user.id).single();
			setPoints(userData?.points ?? 0);

			const { data: eventData } = await supabase.from("events").select("id,title,description,location,date,points,users(name)").order("date", { ascending: true });
			setEvents(eventData ?? []);
			setLoading(false);
		})();
	}, []);

	const deleteEvent = async (id) => {
		if (!window.confirm("Are you sure you want to delete this event?")) return;
		const { error } = await supabase.from("events").delete().eq("id", id);
		if (error) {
			console.error("Delete error:", error);
			alert("Failed to delete event.");
		} else {
			setEvents((prev) => prev.filter((e) => e.id !== id));
		}
	};

	const toggleRegister = async (id, eventPoints) => {
		if (!userId) return;
		const isReg = registered.has(id);

		if (isReg) {
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
			await supabase.from("event_registrations").insert([{ user_id: userId, event_id: id }]);
			await supabase
				.from("users")
				.update({ points: points + eventPoints })
				.eq("id", userId);
			setRegistered((prev) => new Set(prev).add(id));
			setPoints((p) => p + eventPoints);
		}
	};

	if (loading) return <LoadingSpinner />;

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
									setsSubmitting(true);
									const { data, error } = await supabase
										.from("events")
										.insert([{ ...newEvent, created_by: userId }])
										.select()
										.single();
									setsSubmitting(false);
									if (!error && data) {
										setEvents((prev) => [...prev, data]);
										setShowModal(false);
									} else {
										console.error("Event creation error:", error);
										alert("Failed to create event.");
									}
								}}
								submitting={submitting}
							/>
						)}
					</>
				)}

				<div className="space-y-6">
					{events.map((e) => {
						const isReg = registered.has(e.id);
						return (
							<div key={e.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
								<div className="flex justify-between items-start">
									<h2 className="text-xl font-semibold">{e.title}</h2>
									{role === "Admin" && (
										<button onClick={() => deleteEvent(e.id)} className="text-red-600 hover:text-red-800 text-sm">
											Delete
										</button>
									)}
								</div>
								<div className="text-sm text-gray-600 mt-1">+{e.points} pts</div>
								<div className="text-gray-500 text-sm mt-1">
									{new Date(e.date).toLocaleString(undefined, {
										weekday: "short",
										year: "numeric",
										month: "short",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
										timeZoneName: "short",
									})}
								</div>
								<div className="text-gray-500 text-sm">{e.location}</div>
								<p className="mt-4 text-gray-700">{e.description}</p>
								<div className="mt-4 text-sm text-gray-600">
									Created by <span className="font-medium text-gray-800">{e.users?.name ?? "Unknown"}</span>
								</div>
								<div className="mt-6 flex gap-4">
									<button onClick={() => toggleRegister(e.id, e.points)} className={`text-sm font-medium py-2 px-4 rounded transition ${isReg ? "bg-gray-300 hover:bg-gray-400 text-black" : "bg-blue-500 hover:bg-blue-600 text-white"}`} title={isReg ? "Click to cancel your registration" : "Click to register for this event"}>
										{isReg ? "Cancel Registration" : "Register"}
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
			</div>
		</div>
	);
}
