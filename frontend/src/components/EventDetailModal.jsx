import React from "react";
import { X, Calendar, MapPin, User, ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useGoogleLogin } from "@react-oauth/google";
import { addEventToGoogleCalendar } from "../lib/googleCalendarUtils";

export default function EventDetailModal({ event, isOpen, onClose, onRegister, isRegistered, currentUserId, role }) {
	const [googleToken, setGoogleToken] = React.useState(null);
	const [modal, setModal] = React.useState({ open: false, title: "", message: "", onConfirm: null, showCancel: false });

	const loginWithGoogleCalendar = useGoogleLogin({
		scope: "https://www.googleapis.com/auth/calendar.events",
		onSuccess: (tokenResponse) => {
			setGoogleToken(tokenResponse.access_token);
			setModal({ open: true, title: "Success", message: "Google Calendar Connected! You can now add events to your calendar.", onConfirm: () => setModal((m) => ({ ...m, open: false })), showCancel: false });
		},
		onError: (err) => {
			console.error("Google login failed:", err);
			setModal({ open: true, title: "Error", message: "Failed to connect to Google Calendar. Please try again.", onConfirm: () => setModal((m) => ({ ...m, open: false })), showCancel: false });
		},
	});

	const handleAddToCalendar = async () => {
		if (googleToken) {
			const result = await addEventToGoogleCalendar(googleToken, event);
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
	};

	if (!isOpen || !event) return null;

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleString(undefined, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZoneName: "short",
		});
	};

	return (
		<>
			{/* Modal Overlay */}
			<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
				<div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
					{/* Header */}
					<div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-3xl">
						<h2 className="text-3xl font-bold text-gray-900">{event.title}</h2>
						<button onClick={onClose} className="p-3 hover:bg-white/80 rounded-full transition-all duration-200 hover:scale-110">
							<X className="w-6 h-6 text-gray-600" />
						</button>
					</div>

					{/* Content */}
					<div className="p-8 space-y-8">
						{/* Event Info */}
						<div className="bg-gray-50 rounded-2xl p-6 space-y-4">
							<div className="flex items-center gap-4 text-gray-700">
								<div className="p-2 bg-indigo-100 rounded-lg">
									<Calendar className="w-6 h-6 text-indigo-600" />
								</div>
								<div>
									<div className="text-sm text-gray-500 font-medium">Date & Time</div>
									<div className="font-semibold">{formatDate(event.date)}</div>
								</div>
							</div>

							<div className="flex items-center gap-4 text-gray-700">
								<div className="p-2 bg-green-100 rounded-lg">
									<MapPin className="w-6 h-6 text-green-600" />
								</div>
								<div>
									<div className="text-sm text-gray-500 font-medium">Location</div>
									<div className="font-semibold">{event.location}</div>
								</div>
							</div>

							<div className="flex items-center gap-4 text-gray-700">
								<div className="p-2 bg-blue-100 rounded-lg">
									<User className="w-6 h-6 text-blue-600" />
								</div>
								<div>
									<div className="text-sm text-gray-500 font-medium">Organizer</div>
									<div className="font-semibold">{event.users?.name || "Unknown"}</div>
								</div>
							</div>

							<div className="flex items-center gap-4 text-gray-700">
								<div className="p-2 bg-red-100 rounded-lg">
									<Heart className="w-6 h-6 text-red-600" />
								</div>
								<div>
									<div className="text-sm text-gray-500 font-medium">Points</div>
									<div className="font-semibold">+{event.points} points</div>
								</div>
							</div>
						</div>

						{/* Description */}
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">About This Event</h3>
							<div className="bg-white border border-gray-200 rounded-xl p-6">
								<p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
							</div>
						</div>

						{/* Actions */}
						<div className="pt-6 border-t border-gray-200 space-y-3">
							<button onClick={() => onRegister(event.id, event.points)} className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] ${isRegistered ? "bg-gray-300 hover:bg-gray-400 text-gray-800 shadow-md hover:shadow-lg" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl"}`}>
								{isRegistered ? "Cancel Registration" : "Register for Event"}
							</button>

							<button onClick={handleAddToCalendar} className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
								{googleToken ? "Add to Google Calendar" : "Connect Google Calendar"}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Google Calendar Modal */}
			{modal.open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
						{modal.title && <h3 className="text-lg font-bold mb-2 text-gray-900">{modal.title}</h3>}
						<div className="mb-4 text-gray-800">{modal.message}</div>
						<div className="flex justify-end gap-2">
							{modal.showCancel && (
								<button onClick={() => setModal((m) => ({ ...m, open: false }))} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">
									Cancel
								</button>
							)}
							<button onClick={modal.onConfirm || (() => setModal((m) => ({ ...m, open: false })))} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white">
								OK
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
