import { supabase } from "../supabaseClient";
export const FEEDBACK_TABLE = "event_feedback";

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

export async function getUserFeedbackMap() {
	try {
	} catch (err) {
		console.error("unexpected error in getUserFeedbackMap:", err);
		return {};
	}
}
