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

// build feedback count vectors for each event
export function getEventFeedbackVectors(feedbackMap, eventIds) {
	const vectorMap = {};
	eventIds.forEach((id) => {
		const eid = String(id);
		const freq = {};
		for (const uid in feedbackMap) {
			const entry = feedbackMap[uid][eid];
			if (entry) {
				// count how many times each reason was given for this event
				entry.reasons.forEach((r) => {
					freq[r] = (freq[r] || 0) + 1;
				});
			}
		}
		vectorMap[eid] = freq;
	});
	return vectorMap;
}

// calculate Euclidean distance between two vectors
function euclidean(a, b) {
	return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

export function clusterEventsKMeans(eventVectors, k = 5) {
	const eids = Object.keys(eventVectors);
	const features = Array.from(new Set(eids.flatMap((eid) => Object.keys(eventVectors[eid]))));
	const vectors = eids.map((eid) => ({
		id: eid,
		vec: features.map((f) => eventVectors[eid][f] || 0),
	}));

	const kEff = Math.min(k, vectors.length);
	let centroids = vectors.slice(0, kEff).map((v) => [...v.vec]);
	let changed = true;
	let clusters = {};

	while (changed) {
		clusters = {};
		changed = false;

		vectors.forEach(({ id, vec }) => {
			let bestIdx = 0;
			let bestDist = Infinity;
			centroids.forEach((c, i) => {
				const d = euclidean(vec, c);
				if (d < bestDist) {
					bestDist = d;
					bestIdx = i;
				}
			});
			clusters[bestIdx] = clusters[bestIdx] || [];
			clusters[bestIdx].push(id);
		});
		const newCentroids = centroids.map((_, i) => {
			const members = (clusters[i] || []).map((id) => vectors.find((v) => v.id === id).vec);
			if (!members.length) return centroids[i];
			return features.map((_, j) => members.reduce((s, v) => s + v[j], 0) / members.length);
		});

		changed = centroids.some((c, i) => euclidean(c, newCentroids[i]) > 1e-3);
		centroids = newCentroids;
	}

	return clusters;
}
