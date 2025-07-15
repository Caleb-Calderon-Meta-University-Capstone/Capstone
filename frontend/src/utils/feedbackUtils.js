import { supabase } from "../supabaseClient";
export const FEEDBACK_TABLE = "event_feedback";

//save or update user feedback for an event
export async function saveUserFeedback(userId, eventId, liked, reasonsArray) {
	try {
		const { error } = await supabase.from(FEEDBACK_TABLE).upsert({ user_id: userId, event_id: eventId, liked, reasons: reasonsArray }, { onConflict: ["user_id", "event_id"] });
		if (error) {
			console.error("error saving feedback:", error.message);
		}
	} catch (err) {
		console.error("unexpected error in saveUserFeedback:", err);
	}
}

//retrieve all feedback and structure it by user and event
export async function getUserFeedbackMap() {
	try {
		const { data, error } = await supabase.from(FEEDBACK_TABLE).select("*");
		if (error) {
			console.error("error fetching feedback:", error.message);
			return {};
		}
		const map = {};
		data.forEach(({ user_id, event_id, liked, reasons }) => {
			const uid = user_id;
			const eid = String(event_id);
			if (!map[uid]) map[uid] = {};
			// store liked status and convert reasons array to a set for fast lookup
			map[uid][eid] = { liked, reasons: new Set(reasons) };
		});
		return map;
	} catch (err) {
		console.error("unexpected error in getUserFeedbackMap:", err);
		return {};
	}
}

export function getEventFeedbackVectors(feedbackMap, eventIds) {
	const vectorMap = {};
	return vectorMap;
}
