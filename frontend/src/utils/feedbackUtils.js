import { supabase } from "../supabaseClient";
import { academicBuildings } from "../components/constants/academicBuildings";
export const FEEDBACK_TABLE = "event_feedback";

//save update user feedback for an event
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

// helper to categorize locations into buckets
export function getLocationCategory(raw) {
	const l = (raw || "").toLowerCase().trim();

	// virtual / online events
	if (["zoom", "online", "virtual", "remote"].some((v) => l.includes(v))) {
		return "loc:virtual";
	}

	// strip off optional "room"/"rm" plus trailing digits/text
	const base = l.replace(/\b(?:room|rm\.?)?\s*\d+.*$/, "").trim();

	// all Penn State academic buildings & hubs
	if (academicBuildings.some((b) => base.includes(b))) {
		return "loc:academic";
	}

	return "loc:other";
}

// build feedback count vectors for each event
export async function getEventFeedbackVectors(feedbackMap, eventIds) {
	const vectorMap = {};

	// fetch attendee data
	const { data: registrations } = await supabase.from("event_registrations").select("event_id, user_id");

	const attendeeCounts = {};
	for (const r of registrations || []) {
		attendeeCounts[r.event_id] = (attendeeCounts[r.event_id] || 0) + 1;
	}

	// Fetch event metadata
	const { data: eventsData } = await supabase.from("events").select("id, location, duration");

	// Get min/max for normalization
	const durations = eventsData.map((e) => e.duration || 0);
	const attendees = eventsData.map((e) => attendeeCounts[e.id] || 0);

	const durMin = Math.min(...durations, 0);
	const durMax = Math.max(...durations, 1);
	const attMin = Math.min(...attendees, 0);
	const attMax = Math.max(...attendees, 1);

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

		const ev = eventsData.find((e) => e.id === id);
		if (ev) {
			// location bucket
			const locKey = getLocationCategory(ev.location);
			freq[locKey] = 1;

			// duration (normalized)
			if (typeof ev.duration === "number") {
				freq["duration"] = (ev.duration - durMin) / (durMax - durMin);
			}

			// attendees (normalized)
			const attCount = attendeeCounts[id] || 0;
			freq["attendees"] = (attCount - attMin) / (attMax - attMin);
		}

		vectorMap[eid] = freq;
	});

	return vectorMap;
}

// calculate Euclidean distance between two vectors
export function euclidean(a, b) {
	return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

// cluster events into k groups using K-Means
export function clusterEventsKMeans(eventVectors, k = 5) {
	const eids = Object.keys(eventVectors);

	// get all unique feedback types across events (ex. features)
	const features = Array.from(new Set(eids.flatMap((eid) => Object.keys(eventVectors[eid]))));

	// convert each event vector to a full vector using the global feature list
	const vectors = eids.map((eid) => ({
		id: eid,
		vec: features.map((f) => eventVectors[eid][f] || 0),
	}));

	const effectiveK = Math.min(k, vectors.length);
	let centroids = vectors.slice(0, effectiveK).map((v) => [...v.vec]);
	let changed = true;
	let clusters = {};

	while (changed) {
		clusters = {};
		changed = false;

		// assign each vector to the closest centroid
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

		// recalculate centroids by averaging the vectors in each cluster
		const newCentroids = centroids.map((_, i) => {
			const members = (clusters[i] || []).map((id) => vectors.find((v) => v.id === id).vec);
			if (!members.length) return centroids[i];
			return features.map((_, j) => members.reduce((s, v) => s + v[j], 0) / members.length);
		});

		// check if centroids changed significantly
		changed = centroids.some((c, i) => euclidean(c, newCentroids[i]) > 1e-3);
		centroids = newCentroids;
	}

	return clusters;
}

// build and normalize user preference vector from liked feedback
export function getUserPreferenceVector(userId, feedbackMap) {
	const freq = {};
	const userFeedback = feedbackMap[userId] || {};

	// build and normalize user preference vector from liked feedback
	Object.keys(userFeedback).forEach((eid) => {
		const { liked, reasons } = userFeedback[eid];
		if (liked) {
			reasons.forEach((r) => {
				freq[r] = (freq[r] || 0) + 1;
			});
		}
	});

	// normalize the counts into probabilities
	const total = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
	const normalized = {};
	Object.keys(freq).forEach((r) => {
		normalized[r] = freq[r] / total;
	});

	return normalized;
}

// recommend up to topN events based on user preferences
export function recommendEventsForUser(userId, feedbackMap, clusterMap, eventVectors, topN = 5) {
	const prefs = getUserPreferenceVector(userId, feedbackMap);
	const seenEvents = new Set(Object.keys(feedbackMap[userId] || {}));
	const scored = [];
	// iterate through each cluster's events
	Object.values(clusterMap).forEach((members) => {
		members.forEach((eid) => {
			if (!seenEvents.has(eid)) {
				const vec = eventVectors[eid] || {};
				let score = 0;

				// compute dot product between user prefs and event vector
				Object.keys(prefs).forEach((r) => {
					score += prefs[r] * (vec[r] || 0);
				});

				if (score > 0) scored.push({ eid, score });
			}
		});
	});
	// return top N events sorted by relevance score
	return scored
		.sort((a, b) => b.score - a.score)
		.slice(0, topN)
		.map((o) => o.eid);
}
