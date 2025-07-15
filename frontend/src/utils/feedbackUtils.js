import { supabase } from "../supabaseClient";
export const FEEDBACK_TABLE = "event_feedback";

export async function saveUserFeedback(userId, eventId, liked, reasonsArray) {
	try {
	} catch (err) {
		console.error("unexpected error in saveUserFeedback:", err);
	}
}
