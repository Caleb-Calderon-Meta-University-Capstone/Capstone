import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

function isValidPennStateZoomLink(url) {
	return /^https:\/\/psu\.zoom\.us\/j\/[0-9]+(\?.*)?$/.test(url.trim());
}

export default function AddEventModal({ onClose, onSubmit, submitting }) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [location, setLocation] = useState("");
	const [points, setPoints] = useState(10);
	const [duration, setDuration] = useState(60);
	const [locationError, setLocationError] = useState("");

	const resetForm = () => {
		setTitle("");
		setDescription("");
		setDate("");
		setTime("");
		setLocation("");
		setPoints(10);
		setDuration(60);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (location.toLowerCase().includes("zoom")) {
			if (!isValidPennStateZoomLink(location)) {
				setLocationError("Zoom links must be official Penn State links (https://psu.zoom.us/j/...) ");
				return;
			}
		}
		setLocationError("");
		const fullDate = new Date(`${date}T${time}`);
		onSubmit({
			title,
			description,
			date: fullDate.toISOString(),
			location,
			points: Number(points),
			duration: Number(duration),
		});
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="add-event-modal-title">
			<div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 relative">
				<button onClick={onClose} className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-lg" aria-label="Close modal" type="button">
					×
				</button>
				<h2 id="add-event-modal-title" className="text-2xl font-bold mb-1">
					Create New Event
				</h2>
				<p className="text-sm text-gray-500 mb-4">Create an engaging event for the MICS community. All fields marked with * are required.</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="event-title" className="sr-only">
							Event Title *
						</label>
						<input id="event-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex. LinkedIn Workshop" className="w-full border px-3 py-2 rounded bg-blue-50 placeholder-gray-500" autoFocus />
					</div>

					<div>
						<label htmlFor="event-description" className="sr-only">
							Description *
						</label>
						<textarea id="event-description" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide a detailed description of your event..." className="w-full border px-3 py-2 rounded bg-blue-50 placeholder-gray-500 resize-none" rows={4} maxLength={500} />
					</div>

					<div className="flex gap-4">
						<div className="flex-1">
							<label htmlFor="event-date" className="sr-only">
								Date *
							</label>
							<input id="event-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full border px-3 py-2 rounded bg-blue-50" />
						</div>
						<div className="flex-1">
							<label htmlFor="event-time" className="sr-only">
								Time *
							</label>
							<input id="event-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="w-full border px-3 py-2 rounded bg-blue-50" />
						</div>
					</div>

					<div>
						<label htmlFor="event-duration" className="block text-sm font-medium text-gray-700 mb-1">
							Duration (in minutes) *
						</label>
						<input id="event-duration" type="number" required min={1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 60 for a 1-hour event" className="w-full border px-3 py-2 rounded bg-blue-50" />
					</div>

					<div>
						<label htmlFor="event-location" className="sr-only">
							Location *
						</label>
						<input id="event-location" type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ex. Zoom, Student Union, Room 110" className="w-full border px-3 py-2 rounded bg-blue-50" />
						{locationError && <div className="text-red-600 text-sm mt-1">{locationError}</div>}
					</div>

					<div>
						<label htmlFor="event-points" className="sr-only">
							Points *
						</label>
						<select id="event-points" value={points} onChange={(e) => setPoints(e.target.value)} className="w-full border px-3 py-2 rounded bg-blue-50">
							{[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((pt) => (
								<option key={pt} value={pt}>
									{pt} points
								</option>
							))}
						</select>
					</div>

					<div className="text-right">
						<button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
							{submitting ? <LoadingSpinner size={20} /> : "Create Event"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
