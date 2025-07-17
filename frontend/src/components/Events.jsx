import React, { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useGoogleLogin } from "@react-oauth/google";
import { addEventToGoogleCalendar } from "../lib/googleCalendarUtils";
import AddEventModal from "./AddEventModal";
import LoadingSpinner from "./LoadingSpinner";
import FeedbackModal from "./FeedbackModal";
import { saveUserFeedback, getUserFeedbackMap, getEventFeedbackVectors, clusterEventsKMeans, recommendEventsForUser } from "../utils/feedbackUtils";

export default function Events({ role }) {
	const [events, setEvents] = useState([]);
	const [registered, setRegistered] = useState(new Set());
	const [userId, setUserId] = useState(null);
	const [points, setPoints] = useState(0);
	const [loading, setLoading] = useState(true);
	const [showAddModal, setShowAddModal] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [modalEvent, setModalEvent] = useState({});
	const [feedbackType, setFeedbackType] = useState("like");
	const [activeTab, setActiveTab] = useState("all");
	const [recommendedEvents, setRecommendedEvents] = useState([]);
	const [googleToken, setGoogleToken] = useState(null);
	const [query, setQuery] = useState("");

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
			setRegistered(new Set((regData || []).map((r) => r.event_id)));

			const { data: userData } = await supabase.from("users").select("points").eq("id", user.id).single();
			setPoints(userData?.points ?? 0);

			const { data: eventData } = await supabase.from("events").select("id,title,description,location,date,points,users(name)").order("date", { ascending: true });
			const initialEvents = eventData || [];
			setEvents(initialEvents);
			setLoading(false);

			await refreshRecommendations(user.id, initialEvents);
		})();
	}, []);

	const refreshRecommendations = async (uid, allEvents) => {
		const feedbackMap = await getUserFeedbackMap();
		if (!feedbackMap[uid] || Object.keys(feedbackMap[uid]).length === 0) {
			setRecommendedEvents([]);
			return;
		}

		const eventIds = allEvents.map((e) => e.id);
		const vectors = getEventFeedbackVectors(feedbackMap, eventIds);
		const clusters = clusterEventsKMeans(vectors, 5);
		const recIdsRaw = recommendEventsForUser(uid, feedbackMap, clusters, vectors, 10);
		const recIds = recIdsRaw.map((id) => (typeof id === "string" ? Number(id) : id));
		setRecommendedEvents(allEvents.filter((e) => recIds.includes(e.id)));
	};

	const deleteEvent = async (id) => {
		if (!window.confirm("Are you sure you want to delete this event?")) return;
		const { error } = await supabase.from("events").delete().eq("id", id);
		if (error) {
			console.error("Delete error:", error);
			alert("Failed to delete event.");
			return;
		}
		const newEvents = events.filter((e) => e.id !== id);
		setEvents(newEvents);
		await refreshRecommendations(userId, newEvents);
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

	const filterEvents = (list) => {
		const q = query.toLowerCase();
		return list.filter((e) => e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q) || e.users?.name?.toLowerCase().includes(q));
	};

	const renderList = (list) =>
		filterEvents(list).map((e) => {
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
					<div className="mt-6 flex items-center gap-4">
						<button onClick={() => toggleRegister(e.id, e.points)} className={`text-sm font-medium py-2 px-4 rounded transition ${isReg ? "bg-gray-300 hover:bg-gray-400 text-black" : "bg-blue-500 hover:bg-blue-600 text-white"}`}>
							{isReg ? "Cancel Registration" : "Register"}
						</button>
						<button
							onClick={() => {
								if (googleToken) addEventToGoogleCalendar(googleToken, e);
								else loginWithGoogleCalendar();
							}}
							className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded transition"
						>
							{googleToken ? "Add to Google Calendar" : "Connect Google Calendar"}
						</button>
						<button
							onClick={() => {
								setModalEvent(e);
								setFeedbackType("like");
								setModalVisible(true);
							}}
							className="p-2 rounded hover:bg-gray-100"
							aria-label="Like"
						>
							<ThumbsUp size={20} />
						</button>
						<button
							onClick={() => {
								setModalEvent(e);
								setFeedbackType("dislike");
								setModalVisible(true);
							}}
							className="p-2 rounded hover:bg-gray-100"
							aria-label="Dislike"
						>
							<ThumbsDown size={20} />
						</button>
					</div>
				</div>
			);
		});

	return (
		<div className="text-gray-900 min-h-screen">
			<div className="py-8 px-4 max-w-5xl mx-auto">
				<div className="flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-8 mb-4">
					{role === "Admin" && (
						<button onClick={() => setShowAddModal(true)} className="w-40 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded">
							Add Event
						</button>
					)}

					<div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
						<div className="flex items-center w-full sm:w-auto">
							<input type="text" placeholder="Search by title, desc, location, or creator..." className="w-full sm:w-96 bg-white border border-gray-300 rounded px-3 py-2 shadow" value={query} onChange={(e) => setQuery(e.target.value)} />
						</div>

						<div className="flex gap-2">
							<button onClick={() => setActiveTab("all")} className={`py-2 px-4 rounded w-32 ${activeTab === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>
								All Events
							</button>
							<button
								onClick={() => setActiveTab("recommended")}
								className={`w-32 py-2 rounded flex justify-center items-center
                  ${activeTab === "recommended" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
							>
								Recommended
							</button>
						</div>
					</div>
				</div>

				{showAddModal && (
					<AddEventModal
						onClose={() => setShowAddModal(false)}
						onSubmit={async (newEvent) => {
							setSubmitting(true);
							const { data, error } = await supabase
								.from("events")
								.insert([{ ...newEvent, created_by: userId }])
								.select()
								.single();
							setSubmitting(false);
							if (!error && data) {
								const newEvents = [...events, data];
								setEvents(newEvents);
								setShowAddModal(false);
								await refreshRecommendations(userId, newEvents);
							} else {
								console.error("Event creation error:", error);
								alert("Failed to create event.");
							}
						}}
						submitting={submitting}
					/>
				)}

				<div className="space-y-6">{activeTab === "all" ? renderList(events) : recommendedEvents.length > 0 ? renderList(recommendedEvents) : <div className="text-center text-gray-500">No recommendations yet—give some feedback!</div>}</div>

				<div className="text-right mt-6 text-sm text-gray-600 font-semibold">Total Points: {points}</div>
			</div>

			<FeedbackModal
				visible={modalVisible}
				feedbackType={feedbackType}
				eventTitle={modalEvent.title}
				onSubmit={async (reasons) => {
					if (feedbackType === "like" && reasons.length === 0) reasons.push("liked");
					if (userId && modalEvent.id) {
						await saveUserFeedback(userId, modalEvent.id, feedbackType === "like", reasons);
						await refreshRecommendations(userId, events);
					}
					setModalVisible(false);
				}}
				onClose={() => setModalVisible(false)}
			/>
		</div>
	);
}
