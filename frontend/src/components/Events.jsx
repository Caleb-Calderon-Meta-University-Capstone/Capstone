import React, { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useGoogleLogin } from "@react-oauth/google";
import { addEventToGoogleCalendar } from "../lib/googleCalendarUtils";
import AddEventModal from "./AddEventModal";
import LoadingSpinner from "./LoadingSpinner";
import FeedbackModal from "./FeedbackModal";
import AdvancedFiltersModal from "./AdvancedFiltersModal";
import EventDetailModal from "./EventDetailModal";
import { saveUserFeedback, getUserFeedbackMap, getEventFeedbackVectors, clusterEventsKMeans, recommendEventsForUser, generateEventRecommendationExplanation } from "../utils/feedbackUtils";

function Modal({ open, title, message, onClose, onConfirm, confirmText = "OK", cancelText = "Cancel", showCancel = false }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
			<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
				{title && <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>}
				<div className="mb-4 text-gray-800">{message}</div>
				<div className="flex justify-end gap-2">
					{showCancel && (
						<button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">
							{cancelText}
						</button>
					)}
					<button onClick={onConfirm || onClose} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white">
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}

export default function Events({ role, onTabChange }) {
	const navigate = useNavigate();
	const location = useLocation();
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
		userFeedback: {},
		hoveredEvent: null,
		filters: {
			dateRange: { start: null, end: null },
			pointsRange: { min: null, max: null },
			location: "",
			creator: "",
			registrationStatus: "all",
			eventType: "all",
		},
		sortBy: "date",
		sortOrder: "asc",
		showFilters: false,
		showEventDetailModal: false,
		selectedEvent: null,
	});

	const setStateField = (field, value) => {
		setState((prev) => ({ ...prev, [field]: value }));
		if (field === "activeTab" && onTabChange) {
			onTabChange(value);
		}
	};

	const [modal, setModal] = useState({ open: false, title: "", message: "", onConfirm: null, showCancel: false });

	const loginWithGoogleCalendar = useGoogleLogin({
		scope: "https://www.googleapis.com/auth/calendar.events",
		onSuccess: (tokenResponse) => {
			setStateField("googleToken", tokenResponse.access_token);
			setModal({ open: true, title: "Success", message: "Google Calendar Connected! You can now add events to your calendar.", onConfirm: () => setModal((m) => ({ ...m, open: false })), showCancel: false });
		},
		onError: (err) => {
			console.error("Google login failed:", err);
			setModal({ open: true, title: "Error", message: "Failed to connect to Google Calendar. Please try again.", onConfirm: () => setModal((m) => ({ ...m, open: false })), showCancel: false });
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

	const refreshRecommendations = useCallback(async (uid, allEvents, registeredEventIds = []) => {
		const feedbackMap = await getUserFeedbackMap();

		if (!feedbackMap[uid] || Object.keys(feedbackMap[uid]).length === 0) {
			setStateField("recommendedEvents", []);
			setStateField("userFeedback", {});
			return;
		}

		setStateField("userFeedback", feedbackMap[uid]);

		const eventIds = allEvents.map((e) => e.id);
		const vectors = await getEventFeedbackVectors(feedbackMap, eventIds);
		const clusters = clusterEventsKMeans(vectors, 5);
		const recIdsRaw = recommendEventsForUser(uid, feedbackMap, clusters, vectors, registeredEventIds, 10);
		const recIds = recIdsRaw.map((id) => (typeof id === "string" ? Number(id) : id));
		const recommendedEvents = allEvents.filter((e) => recIds.includes(e.id));

		setStateField("recommendedEvents", recommendedEvents);
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
			await refreshRecommendations(user.id, userData.events, Array.from(userData.registered));
		})();
	}, [fetchUserData, refreshRecommendations]);

	useEffect(() => {
		if (!state.loading && state.events.length > 0) {
			const searchParams = new URLSearchParams(location.search);
			const eventId = searchParams.get("event");

			if (eventId) {
				const event = state.events.find((e) => e.id.toString() === eventId);
				if (event) {
					setState((prev) => ({
						...prev,
						selectedEvent: event,
						showEventDetailModal: true,
					}));
					const newUrl = new URL(window.location);
					newUrl.searchParams.delete("event");
					window.history.replaceState({}, "", newUrl);
				}
			}
		}
	}, [state.loading, state.events, location.search]);

	const deleteEvent = async (id) => {
		setModal({
			open: true,
			title: "Delete Event",
			message: "Are you sure you want to delete this event?",
			showCancel: true,
			onConfirm: async () => {
				setModal((m) => ({ ...m, open: false }));
				const { error } = await supabase.from("events").delete().eq("id", id);
				if (error) {
					console.error("Delete error:", error);
					setModal({ open: true, title: "Error", message: "Failed to delete event.", onConfirm: () => setModal((m) => ({ ...m, open: false })), showCancel: false });
					return;
				}
				const newEvents = state.events.filter((e) => e.id !== id);
				setStateField("events", newEvents);
				await refreshRecommendations(state.userId, newEvents, Array.from(state.registered));
			},
			onClose: () => setModal((m) => ({ ...m, open: false })),
		});
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
			await refreshRecommendations(state.userId, newEvents, Array.from(state.registered));
		} else {
			console.error("Event creation error:", error);
			setModal({ open: true, title: "Error", message: "Failed to create event.", onConfirm: () => setModal((m) => ({ ...m, open: false })), showCancel: false });
		}
	};

	const handleFeedback = async (reasons) => {
		if (state.feedbackType === "like" && reasons.length === 0) reasons.push("liked");
		if (state.userId && state.modalEvent.id) {
			await saveUserFeedback(state.userId, state.modalEvent.id, state.feedbackType === "like", reasons);
			await refreshRecommendations(state.userId, state.events, Array.from(state.registered));
		}
		setStateField("modalVisible", false);
	};

	const openEventDetailModal = (event) => {
		setState((prev) => ({
			...prev,
			selectedEvent: event,
			showEventDetailModal: true,
		}));
	};

	const closeEventDetailModal = () => {
		setState((prev) => ({
			...prev,
			showEventDetailModal: false,
			selectedEvent: null,
		}));
	};

	const filterEvents = (list) => {
		let filtered = list;

		if (state.query) {
			const q = state.query.toLowerCase();
			filtered = filtered.filter((e) => e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q) || e.users?.name?.toLowerCase().includes(q));
		}

		// Date range filter
		if (state.filters.dateRange.start || state.filters.dateRange.end) {
			filtered = filtered.filter((e) => {
				const eventDate = new Date(e.date);
				const start = state.filters.dateRange.start ? new Date(state.filters.dateRange.start) : null;
				const end = state.filters.dateRange.end ? new Date(state.filters.dateRange.end) : null;

				if (start && end) {
					return eventDate >= start && eventDate <= end;
				} else if (start) {
					return eventDate >= start;
				} else if (end) {
					return eventDate <= end;
				}
				return true;
			});
		}

		if (state.filters.pointsRange.min !== null || state.filters.pointsRange.max !== null) {
			filtered = filtered.filter((e) => {
				const points = e.points || 0;
				const min = state.filters.pointsRange.min !== null ? state.filters.pointsRange.min : 0;
				const max = state.filters.pointsRange.max !== null ? state.filters.pointsRange.max : Infinity;
				return points >= min && points <= max;
			});
		}

		if (state.filters.location) {
			filtered = filtered.filter((e) => e.location?.toLowerCase().includes(state.filters.location.toLowerCase()));
		}

		if (state.filters.creator) {
			filtered = filtered.filter((e) => e.users?.name?.toLowerCase().includes(state.filters.creator.toLowerCase()));
		}

		if (state.filters.registrationStatus !== "all") {
			filtered = filtered.filter((e) => {
				const isRegistered = state.registered.has(e.id);
				return state.filters.registrationStatus === "registered" ? isRegistered : !isRegistered;
			});
		}

		if (state.filters.eventType !== "all") {
			filtered = filtered.filter((e) => {
				const title = e.title?.toLowerCase() || "";
				const description = e.description?.toLowerCase() || "";
				const content = title + " " + description;

				switch (state.filters.eventType) {
					case "workshop":
						return content.includes("workshop") || content.includes("training") || content.includes("session");
					case "networking":
						return content.includes("networking") || content.includes("meet") || content.includes("social");
					case "seminar":
						return content.includes("seminar") || content.includes("lecture") || content.includes("talk");
					case "hackathon":
						return content.includes("hackathon") || content.includes("competition") || content.includes("contest");
					case "conference":
						return content.includes("conference") || content.includes("summit") || content.includes("symposium");
					default:
						return true;
				}
			});
		}

		return filtered;
	};

	const renderEventCard = (e) => {
		const isReg = state.registered.has(e.id);
		const isRecommended = state.activeTab === "recommended";

		return (
			<div key={e.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col relative cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-transparent hover:border-indigo-200" onClick={() => openEventDetailModal(e)}>
				<div className="flex justify-between items-start">
					<h2
						className="text-xl font-semibold cursor-pointer hover:text-indigo-600 transition-colors"
						onClick={(event) => {
							event.stopPropagation();
							openEventDetailModal(e);
						}}
					>
						{e.title}
					</h2>
					<div className="flex items-center gap-2">
						{isRecommended && (
							<div className="relative inline-block">
								<HelpCircle
									className="w-5 h-5 text-indigo-500 hover:text-indigo-600 cursor-pointer"
									onMouseEnter={(event) => {
										event.stopPropagation();
										setStateField("hoveredEvent", e.id);
									}}
									onMouseLeave={(event) => {
										event.stopPropagation();
										setStateField("hoveredEvent", null);
									}}
								/>
								{state.hoveredEvent === e.id && (
									<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-4 bg-white text-gray-800 text-sm rounded-lg shadow-xl z-50 border border-indigo-200">
										<div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-indigo-200 rotate-45" />
										<div className="font-bold mb-3 text-indigo-700">Why was this recommended?</div>
										<div className="text-sm" dangerouslySetInnerHTML={{ __html: generateEventRecommendationExplanation(e, state.userFeedback) }} />
									</div>
								)}
							</div>
						)}
						{role === "Admin" && (
							<button
								onClick={(event) => {
									event.stopPropagation();
									deleteEvent(e.id);
								}}
								className="text-red-600 hover:text-red-800 text-sm"
							>
								Delete
							</button>
						)}
					</div>
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
					<button
						onClick={(event) => {
							event.stopPropagation();
							toggleRegister(e.id, e.points);
						}}
						className={`text-sm font-medium py-2 px-4 rounded transition ${isReg ? "bg-gray-300 hover:bg-gray-400 text-black" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
					>
						{isReg ? "Cancel Registration" : "Register"}
					</button>
					<button
						onClick={async (event) => {
							event.stopPropagation();
							if (state.googleToken) {
								const result = await addEventToGoogleCalendar(state.googleToken, e);
								setModal({
									open: true,
									title: result.success ? "Success" : "Error",
									message: result.message,
									onConfirm: () => setModal((m) => ({ ...m, open: false })),
									showCancel: false,
								});
							} else {
								loginWithGoogleCalendar();
							}
						}}
						className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded transition"
					>
						{state.googleToken ? "Add to Google Calendar" : "Connect Google Calendar"}
					</button>
					<button
						onClick={(event) => {
							event.stopPropagation();
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
						onClick={(event) => {
							event.stopPropagation();
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

	const ColoredExplanation = ({ explanation }) => {
		if (typeof explanation === "string") {
			return <span>{explanation}</span>;
		}

		return <span>{explanation}</span>;
	};

	const sortEvents = (list) => {
		const sorted = [...list];
		sorted.sort((a, b) => {
			let aValue, bValue;

			switch (state.sortBy) {
				case "date":
					aValue = new Date(a.date);
					bValue = new Date(b.date);
					break;
				case "title":
					aValue = a.title?.toLowerCase() || "";
					bValue = b.title?.toLowerCase() || "";
					break;
				case "points":
					aValue = a.points || 0;
					bValue = b.points || 0;
					break;
				case "creator":
					aValue = a.users?.name?.toLowerCase() || "";
					bValue = b.users?.name?.toLowerCase() || "";
					break;
				case "location":
					aValue = a.location?.toLowerCase() || "";
					bValue = b.location?.toLowerCase() || "";
					break;
				default:
					aValue = new Date(a.date);
					bValue = new Date(b.date);
			}

			if (state.sortOrder === "asc") {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});

		return sorted;
	};

	const renderEventList = (list) => {
		const filtered = filterEvents(list);
		const sorted = sortEvents(filtered);
		return sorted.map(renderEventCard);
	};

	if (state.loading) return <LoadingSpinner />;

	return (
		<div className="text-gray-900 min-h-screen">
			<Modal {...modal} />
			<div className="py-8 px-4 max-w-6xl mx-auto">
				<div className="mb-8">
					<div className="relative max-w-2xl mx-auto">
						<input type="text" placeholder="Search events by title, description, location, or creator..." className="w-full bg-white/95 backdrop-blur-sm border-0 rounded-xl px-4 py-3 pl-12 text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50" value={state.query} onChange={(e) => setStateField("query", e.target.value)} />
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap justify-center gap-3 mb-8">
					<button onClick={() => setStateField("activeTab", "all")} className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${state.activeTab === "all" ? "bg-white text-indigo-700 shadow-lg" : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"}`}>
						All Events
					</button>
					<button onClick={() => setStateField("activeTab", "recommended")} className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${state.activeTab === "recommended" ? "bg-white text-indigo-700 shadow-lg" : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"}`}>
						Recommended
					</button>
				</div>

				<div className="flex flex-wrap justify-center gap-3 mb-8">
					{role === "Admin" && (
						<button onClick={() => setStateField("showAddModal", true)} className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Event
						</button>
					)}

					<button onClick={() => navigate("/events/visualization")} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						View Visualization
					</button>

					<button onClick={() => setStateField("showFilters", !state.showFilters)} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
						</svg>
						{state.showFilters ? "Hide Filters" : "Advanced Filters"}
					</button>
				</div>

				<AdvancedFiltersModal
					visible={state.showFilters}
					onClose={() => setStateField("showFilters", false)}
					filters={state.filters}
					onFiltersChange={(filters) => setStateField("filters", filters)}
					sortBy={state.sortBy}
					sortOrder={state.sortOrder}
					onSortChange={({ sortBy, sortOrder }) => {
						setStateField("sortBy", sortBy);
						setStateField("sortOrder", sortOrder);
					}}
				/>

				{state.showAddModal && <AddEventModal onClose={() => setStateField("showAddModal", false)} onSubmit={handleAddEvent} submitting={state.submitting} />}

				<div className="mb-4 text-sm text-white">
					{(() => {
						const list = state.activeTab === "all" ? state.events : state.recommendedEvents;
						const filtered = filterEvents(list);
						const total = list.length;
						const showing = filtered.length;
						return `Showing ${showing} of ${total} events`;
					})()}
				</div>

				<div className="space-y-6">{state.activeTab === "all" ? renderEventList(state.events) : state.recommendedEvents.length > 0 ? renderEventList(state.recommendedEvents) : <div className="text-center text-gray-500">No recommendations yet! Give some feedback!</div>}</div>

				<div className="text-right mt-6 text-sm text-white font-semibold">Total Points: {state.points}</div>
			</div>

			<FeedbackModal visible={state.modalVisible} feedbackType={state.feedbackType} eventTitle={state.modalEvent.title} onSubmit={handleFeedback} onClose={() => setStateField("modalVisible", false)} />

			<EventDetailModal event={state.selectedEvent} isOpen={state.showEventDetailModal} onClose={closeEventDetailModal} onRegister={toggleRegister} isRegistered={state.selectedEvent ? state.registered.has(state.selectedEvent.id) : false} currentUserId={state.userId} role={role} />
		</div>
	);
}
