import React, { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useGoogleLogin } from "@react-oauth/google";
import { addEventToGoogleCalendar } from "../lib/googleCalendarUtils";
import AddEventModal from "./AddEventModal";
import LoadingSpinner from "./LoadingSpinner";
import FeedbackModal from "./FeedbackModal";
import { saveUserFeedback, getUserFeedbackMap, getEventFeedbackVectors, clusterEventsKMeans, recommendEventsForUser } from "../utils/feedbackUtils";

export default function Events({ role }) {
	const [state, setState] = useState({
		events: [],
		registered: new Set(),
		userId: null,
		points: 0,
		loading: true,
		showAddModal: false,
		submitting: false,
		modalVisible: false,
		modalEvent: {},
		feedbackType: "like",
		activeTab: "all",
		recommendedEvents: [],
		googleToken: null,
		query: "",
	});

	const setStateField = (field, value) => setState((prev) => ({ ...prev, [field]: value }));

	const loginWithGoogleCalendar = useGoogleLogin({
		scope: "https://www.googleapis.com/auth/calendar.events",
		onSuccess: (tokenResponse) => {
			setStateField("googleToken", tokenResponse.access_token);
			alert("Google Calendar Connected!");
		},
		onError: (err) => {
			console.error("Google login failed:", err);
			alert("Failed to connect to Google Calendar");
		},
	});

	const fetchUserData = useCallback(async (user) => {
		const { data: regData } = await supabase.from("event_registrations").select("event_id").eq("user_id", user.id);
		const { data: userData } = await supabase.from("users").select("points").eq("id", user.id).single();
		const { data: eventData } = await supabase.from("events").select("id,title,description,location,date,points,users(name)").order("date", { ascending: true });
		return {
			userId: user.id,
			registered: new Set((regData || []).map((r) => r.event_id)),
			points: userData?.points ?? 0,
			events: eventData || [],
		};
	}, []);

	const refreshRecommendations = useCallback(async (uid, allEvents) => {
		const feedbackMap = await getUserFeedbackMap();
		if (!feedbackMap[uid] || Object.keys(feedbackMap[uid]).length === 0) {
			setStateField("recommendedEvents", []);
			return;
		}
		const eventIds = allEvents.map((e) => e.id);
		const vectors = await getEventFeedbackVectors(feedbackMap, eventIds);
		const clusters = clusterEventsKMeans(vectors, 5);
		const recIdsRaw = recommendEventsForUser(uid, feedbackMap, clusters, vectors, 10);
		const recIds = recIdsRaw.map((id) => (typeof id === "string" ? Number(id) : id));
		setStateField(
			"recommendedEvents",
			allEvents.filter((e) => recIds.includes(e.id))
		);
	}, []);

	useEffect(() => {
		(async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				setStateField("loading", false);
				return;
			}
			const userData = await fetchUserData(user);
			setState((prev) => ({ ...prev, ...userData, loading: false }));
			await refreshRecommendations(user.id, userData.events);
		})();
	}, [fetchUserData, refreshRecommendations]);

	const deleteEvent = async (id) => {
		if (!window.confirm("Are you sure you want to delete this event?")) return;
		const { error } = await supabase.from("events").delete().eq("id", id);
		if (error) {
			console.error("Delete error:", error);
			alert("Failed to delete event.");
			return;
		}
		const newEvents = state.events.filter((e) => e.id !== id);
		setStateField("events", newEvents);
		await refreshRecommendations(state.userId, newEvents);
	};

	const toggleRegister = async (id, eventPoints) => {
		if (!state.userId) return;
		const isReg = state.registered.has(id);
		if (isReg) {
			await supabase.from("event_registrations").delete().eq("user_id", state.userId).eq("event_id", id);
			await supabase
				.from("users")
				.update({ points: state.points - eventPoints })
				.eq("id", state.userId);
			setState((prev) => ({
				...prev,
				registered: new Set([...prev.registered].filter((r) => r !== id)),
				points: prev.points - eventPoints,
			}));
		} else {
			await supabase.from("event_registrations").insert([{ user_id: state.userId, event_id: id }]);
			await supabase
				.from("users")
				.update({ points: state.points + eventPoints })
				.eq("id", state.userId);
			setState((prev) => ({
				...prev,
				registered: new Set([...prev.registered, id]),
				points: prev.points + eventPoints,
			}));
		}
	};

	const handleAddEvent = async (newEvent) => {
		setStateField("submitting", true);
		const { data, error } = await supabase
			.from("events")
			.insert([{ ...newEvent, created_by: state.userId }])
			.select()
			.single();
		setStateField("submitting", false);
		if (!error && data) {
			const newEvents = [...state.events, data];
			setStateField("events", newEvents);
			setStateField("showAddModal", false);
			await refreshRecommendations(state.userId, newEvents);
		} else {
			console.error("Event creation error:", error);
			alert("Failed to create event.");
		}
	};

	const handleFeedback = async (reasons) => {
		if (state.feedbackType === "like" && reasons.length === 0) reasons.push("liked");
		if (state.userId && state.modalEvent.id) {
			await saveUserFeedback(state.userId, state.modalEvent.id, state.feedbackType === "like", reasons);
			await refreshRecommendations(state.userId, state.events);
		}
		setStateField("modalVisible", false);
	};

	const filterEvents = (list) => {
		const q = state.query.toLowerCase();
		return list.filter((e) => e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q) || e.users?.name?.toLowerCase().includes(q));
	};

	const renderEventCard = (e) => {
		const isReg = state.registered.has(e.id);
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
							if (state.googleToken) addEventToGoogleCalendar(state.googleToken, e);
							else loginWithGoogleCalendar();
						}}
						className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded transition"
					>
						{state.googleToken ? "Add to Google Calendar" : "Connect Google Calendar"}
					</button>
					<button
						onClick={() => {
							setStateField("modalEvent", e);
							setStateField("feedbackType", "like");
							setStateField("modalVisible", true);
						}}
						className="p-2 rounded hover:bg-gray-100"
						aria-label="Like"
					>
						<ThumbsUp size={20} />
					</button>
					<button
						onClick={() => {
							setStateField("modalEvent", e);
							setStateField("feedbackType", "dislike");
							setStateField("modalVisible", true);
						}}
						className="p-2 rounded hover:bg-gray-100"
						aria-label="Dislike"
					>
						<ThumbsDown size={20} />
					</button>
				</div>
			</div>
		);
	};

	const renderEventList = (list) => filterEvents(list).map(renderEventCard);

	if (state.loading) return <LoadingSpinner />;

	return (
		<div className="text-gray-900 min-h-screen">
			<div className="py-8 px-4 max-w-5xl mx-auto">
				<div className="flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-8 mb-4">
					{role === "Admin" && (
						<button onClick={() => setStateField("showAddModal", true)} className="w-40 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded">
							Add Event
						</button>
					)}
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
						<div className="flex items-center w-full sm:w-auto">
							<input type="text" placeholder="Search by title, desc, location, or creator..." className="w-full sm:w-96 bg-white border border-gray-300 rounded px-3 py-2 shadow" value={state.query} onChange={(e) => setStateField("query", e.target.value)} />
						</div>
						<div className="flex gap-2">
							<button onClick={() => setStateField("activeTab", "all")} className={`py-2 px-4 rounded w-32 ${state.activeTab === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>
								All Events
							</button>
							<button onClick={() => setStateField("activeTab", "recommended")} className={`w-32 py-2 rounded flex justify-center items-center ${state.activeTab === "recommended" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>
								Recommended
							</button>
						</div>
					</div>
				</div>

				{state.showAddModal && <AddEventModal onClose={() => setStateField("showAddModal", false)} onSubmit={handleAddEvent} submitting={state.submitting} />}

				<div className="space-y-6">{state.activeTab === "all" ? renderEventList(state.events) : state.recommendedEvents.length > 0 ? renderEventList(state.recommendedEvents) : <div className="text-center text-gray-500">No recommendations yet! Give some feedback!</div>}</div>

				<div className="text-right mt-6 text-sm text-gray-600 font-semibold">Total Points: {state.points}</div>
			</div>

			<FeedbackModal visible={state.modalVisible} feedbackType={state.feedbackType} eventTitle={state.modalEvent.title} onSubmit={handleFeedback} onClose={() => setStateField("modalVisible", false)} />
		</div>
	);
}
