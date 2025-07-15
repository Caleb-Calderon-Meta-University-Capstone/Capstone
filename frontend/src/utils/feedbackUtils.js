import { supabase } from "../supabaseClient";
export const FEEDBACK_TABLE = "event_feedback";

export async function saveUserFeedback(userId, eventId, liked, reasonsArray) {
	try {
		const { error } = await supabase.from(FEEDBACK_TABLE).upsert({ user_id: userId, event_id: eventId, liked, reasons: reasonsArray }, { onConflict: ["user_id", "event_id"] });
	} catch (err) {
		console.error("unexpected error in saveUserFeedback:", err);
	}
}
