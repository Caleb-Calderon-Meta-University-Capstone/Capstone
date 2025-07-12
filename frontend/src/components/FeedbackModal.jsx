import React, { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { POSITIVE_OPTIONS, NEGATIVE_OPTIONS } from "./constants/options";

export default function FeedbackModal({ visible, feedbackType, eventTitle, onSubmit, onClose }) {
	const [selectedReasons, setSelectedReasons] = useState(new Set());

	useEffect(() => {
		if (!visible) setSelectedReasons(new Set());
	}, [visible]);

	if (!visible) return null;

	const options = feedbackType === "like" ? POSITIVE_OPTIONS : NEGATIVE_OPTIONS;
	const titleText = feedbackType === "like" ? "What did you like about this event?" : "What didn’t you like about this event?";
	const Icon = feedbackType === "like" ? ThumbsUp : ThumbsDown;

	const toggleReason = (key) => {
		setSelectedReasons((prev) => {
			const copy = new Set(prev);
			copy.has(key) ? copy.delete(key) : copy.add(key);
			return copy;
		});
	};

	const handleSubmit = () => {
		onSubmit([...selectedReasons]);
	};
	const handleClose = () => {
		setSelectedReasons(new Set());
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-30 backdrop-blur-sm">
			<div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
				<div className="flex justify-between items-center mb-4">
					<div className="flex items-center space-x-2">
						<Icon size={24} className={feedbackType === "like" ? "text-indigo-600" : "text-red-600"} />
						<h3 className="text-lg font-semibold text-gray-900">{titleText}</h3>
					</div>
					<button onClick={handleClose} className="p-1 rounded hover:bg-gray-100">
						<X size={20} className="text-gray-600" />
					</button>
				</div>
				<p className="text-sm text-gray-600 italic mb-6 text-center">"{eventTitle}"</p>
				<div className="grid grid-cols-2 gap-3 mb-6">
					{options.map(({ key, label, description }) => (
						<button key={key} onClick={() => toggleReason(key)} className={`py-2 px-3 rounded-lg text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${selectedReasons.has(key) ? "bg-indigo-100 border border-indigo-300" : "bg-white border border-gray-200 hover:bg-gray-50"}`}>
							<div className="font-medium text-gray-800">{label}</div>
							<div className="text-xs text-gray-600 mt-1">{description}</div>
						</button>
					))}
				</div>
				<div className="flex justify-end">
					<button onClick={handleClose} className="mr-3 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium">
						Cancel
					</button>
					<button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white">
						Submit
					</button>
				</div>
			</div>
		</div>
	);
}
