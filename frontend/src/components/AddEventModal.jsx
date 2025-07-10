import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

export default function AddEventModal({ onClose, onSubmit, submitting }) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [location, setLocation] = useState("");
	const [points, setPoints] = useState(10);
	const [duration, setDuration] = useState(60);

	const handleSubmit = (e) => {
		e.preventDefault();

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
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
			<div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 relative">
				<button onClick={onClose} className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-lg">
					×
				</button>
				<h2 className="text-2xl font-bold mb-1">Create New Event</h2>
				<p className="text-sm text-gray-500 mb-4">Create an engaging event for the MICS community. All fields marked with * are required.</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex. LinkedIn Workshop" className="w-full border px-3 py-2 rounded bg-blue-50 placeholder-gray-500" />

					<textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide a detailed description of your event..." className="w-full border px-3 py-2 rounded bg-blue-50 placeholder-gray-500 resize-none" rows={4} maxLength={500} />

					<div className="flex gap-4">
						<input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 border px-3 py-2 rounded bg-blue-50" />
						<input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 border px-3 py-2 rounded bg-blue-50" />
					</div>

					<div>
						<label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
							Duration (in minutes)
						</label>
						<input id="duration" type="number" required min={1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 60 for a 1-hour event" className="w-full border px-3 py-2 rounded bg-blue-50" />
					</div>

					<input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ex. Zoom, Student Union, Room 110" className="w-full border px-3 py-2 rounded bg-blue-50" />

					<select value={points} onChange={(e) => setPoints(e.target.value)} className="w-full border px-3 py-2 rounded bg-blue-50">
						<option value={5}>5 points</option>
						<option value={10}>10 points</option>
						<option value={15}>15 points</option>
						<option value={20}>20 points</option>
						<option value={25}>25 points</option>
						<option value={30}>30 points</option>
						<option value={35}>35 points</option>
						<option value={40}>40 points</option>
						<option value={45}>45 points</option>
						<option value={50}>50 points</option>
					</select>

					<div className="text-right">
						<button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
							{submitting ? "Submitting..." : "Create Event"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
