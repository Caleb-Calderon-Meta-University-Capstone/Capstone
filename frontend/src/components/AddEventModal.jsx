import React, { useState } from "react";

export default function AddEventModal({ onClose, onSubmit }) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [location, setLocation] = useState("");
	const [points, setPoints] = useState(10);

	const handleSubmit = (e) => {
		e.preventDefault();

		const fullDate = new Date(`${date}T${time}`);

		onSubmit({
			title,
			description,
			date: fullDate.toISOString(),
			location,
			points: Number(points),
		});

		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
			<div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-lg"
				>
					×
				</button>
				<h2 className="text-2xl font-bold mb-1">Create New Event ✨</h2>
				<p className="text-sm text-gray-500 mb-4">
					Create an engaging event for the MICS community. All fields marked with * are required.
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<input
						type="text"
						required
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="e.g., React Workshop for Beginners"
						className="w-full border px-3 py-2 rounded bg-blue-50 placeholder-gray-500"
					/>

					<textarea
						required
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Provide a detailed description of your event..."
						className="w-full border px-3 py-2 rounded bg-blue-50 placeholder-gray-500 resize-none"
						rows={4}
						maxLength={500}
					/>

					<div className="flex gap-4">
						<input
							type="date"
							required
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="flex-1 border px-3 py-2 rounded bg-blue-50"
						/>
						<input
							type="time"
							required
							value={time}
							onChange={(e) => setTime(e.target.value)}
							className="flex-1 border px-3 py-2 rounded bg-blue-50"
						/>
					</div>

					<input
						type="text"
						required
						value={location}
						onChange={(e) => setLocation(e.target.value)}
						placeholder="e.g., Zoom, Student Union, Room 110"
						className="w-full border px-3 py-2 rounded bg-blue-50"
					/>

					<select
						value={points}
						onChange={(e) => setPoints(e.target.value)}
						className="w-full border px-3 py-2 rounded bg-blue-50"
					>
						<option value={10}>10 points – Regular event</option>
						<option value={5}>5 points – Small workshop</option>
						<option value={15}>15 points – Big event</option>
					</select>

					<div className="text-right">
						<button
							type="submit"
							className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded font-semibold"
						>
							Create Event
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
