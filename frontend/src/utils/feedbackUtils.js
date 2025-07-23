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
	const location = (raw || "").toLowerCase().trim();

	// virtual / online events
	if (["zoom", "online", "virtual", "remote"].some((v) => location.includes(v))) {
		return "loc:virtual";
	}

	// strip off optional "room"/"rm" plus trailing digits/text
	const base = location.replace(/\b(?:room|rm\.?)?\s*\d+.*$/, "").trim();

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
export function getUserPreferenceVector(userId, feedbackMap, eventVectors) {
	const freq = {};
	const userFeedback = feedbackMap[userId] || {};

	// build and normalize user preference vector from liked feedback
	Object.keys(userFeedback).forEach((eid) => {
		const { liked, reasons } = userFeedback[eid];
		if (liked) {
			reasons.forEach((r) => {
				freq[r] = (freq[r] || 0) + 1;
			});
			// Include the event's full feature vector
			const evVec = eventVectors[eid] || {};
			Object.entries(evVec).forEach(([f, v]) => {
				freq[f] = (freq[f] || 0) + v;
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
export function recommendEventsForUser(userId, feedbackMap, clusterMap, eventVectors, registeredEventIds = [], topN = 5) {
	const prefs = getUserPreferenceVector(userId, feedbackMap, eventVectors);
	const seenEvents = new Set(Object.keys(feedbackMap[userId] || {}));

	// Convert registered event IDs to strings for comparison
	const registeredEvents = new Set(registeredEventIds.map((id) => String(id)));

	// Combine seen events (feedback) and registered events
	const excludedEvents = new Set([...seenEvents, ...registeredEvents]);

	const scored = [];
	// iterate through each cluster's events
	Object.values(clusterMap).forEach((members) => {
		members.forEach((eid) => {
			if (!excludedEvents.has(eid)) {
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

//generate detailed explanation for why an event was recommended
export function generateEventRecommendationExplanation(event, userFeedback) {
	const reasons = [];

	// Get all the reasons the user has liked events, categorized by type
	const likedReasons = [];
	const locationReasons = [];
	const durationReasons = [];
	const typeReasons = [];
	const qualityReasons = [];

	Object.values(userFeedback).forEach((feedback) => {
		if (feedback.liked) {
			feedback.reasons.forEach((reason) => {
				const reasonLower = reason.toLowerCase();
				likedReasons.push(reasonLower);

				// Categorize reasons
				if (reasonLower.includes("virtual") || reasonLower.includes("online") || reasonLower.includes("zoom") || reasonLower.includes("campus") || reasonLower.includes("academic") || reasonLower.includes("building") || reasonLower.includes("hub") || reasonLower.includes("center")) {
					locationReasons.push(reasonLower);
				}

				if (reasonLower.includes("short") || reasonLower.includes("quick") || reasonLower.includes("brief") || reasonLower.includes("long") || reasonLower.includes("in-depth") || reasonLower.includes("detailed")) {
					durationReasons.push(reasonLower);
				}

				if (
					reasonLower.includes("workshop") ||
					reasonLower.includes("hands-on") ||
					reasonLower.includes("practical") ||
					reasonLower.includes("networking") ||
					reasonLower.includes("connections") ||
					reasonLower.includes("people") ||
					reasonLower.includes("career") ||
					reasonLower.includes("professional") ||
					reasonLower.includes("job") ||
					reasonLower.includes("social") ||
					reasonLower.includes("fun") ||
					reasonLower.includes("friends") ||
					reasonLower.includes("tech") ||
					reasonLower.includes("technical") ||
					reasonLower.includes("coding") ||
					reasonLower.includes("programming")
				) {
					typeReasons.push(reasonLower);
				}

				if (reasonLower.includes("popular") || reasonLower.includes("high-rated") || reasonLower.includes("quality") || reasonLower.includes("valuable") || reasonLower.includes("worthwhile")) {
					qualityReasons.push(reasonLower);
				}
			});
		}
	});

	// Location-based recommendations with specific details
	if (event.location) {
		const location = event.location.toLowerCase();
		if (location.includes("zoom") || location.includes("virtual") || location.includes("online")) {
			const virtualMatches = locationReasons.filter((reason) => reason.includes("virtual") || reason.includes("online") || reason.includes("zoom"));
			if (virtualMatches.length > 0) {
				const uniqueReasons = [...new Set(virtualMatches)].slice(0, 2);
				reasons.push(`you <span class="text-blue-600 font-semibold">liked</span> <span class="text-indigo-600 font-semibold">${uniqueReasons.join(" and ")}</span> events`);
			}
		} else if (location.includes("thomas") || location.includes("west") || location.includes("east")) {
			const campusMatches = locationReasons.filter((reason) => reason.includes("campus") || reason.includes("academic") || reason.includes("building"));
			if (campusMatches.length > 0) {
				const uniqueReasons = [...new Set(campusMatches)].slice(0, 2);
				reasons.push(`you <span class="text-blue-600 font-semibold">enjoyed</span> <span class="text-indigo-600 font-semibold">${uniqueReasons.join(" and ")}</span> events`);
			}
		} else if (location.includes("hub") || location.includes("center")) {
			const hubMatches = locationReasons.filter((reason) => reason.includes("hub") || reason.includes("center"));
			if (hubMatches.length > 0) {
				reasons.push(`you <span class="text-blue-600 font-semibold">preferred</span> <span class="text-indigo-600 font-semibold">${hubMatches[0]}</span> events`);
			}
		}
	}

	// Duration-based recommendations with specific details
	if (event.duration) {
		if (event.duration <= 60) {
			const shortMatches = durationReasons.filter((reason) => reason.includes("short") || reason.includes("quick") || reason.includes("brief"));
			if (shortMatches.length > 0) {
				const uniqueReasons = [...new Set(shortMatches)].slice(0, 2);
				reasons.push(`you <span class="text-green-600 font-semibold">liked</span> <span class="text-teal-600 font-semibold">${uniqueReasons.join(" and ")}</span> events`);
			}
		} else if (event.duration >= 120) {
			const longMatches = durationReasons.filter((reason) => reason.includes("long") || reason.includes("in-depth") || reason.includes("detailed"));
			if (longMatches.length > 0) {
				const uniqueReasons = [...new Set(longMatches)].slice(0, 2);
				reasons.push(`you <span class="text-green-600 font-semibold">enjoyed</span> <span class="text-teal-600 font-semibold">${uniqueReasons.join(" and ")}</span> sessions`);
			}
		}
	}

	// Event type recommendations with specific details
	const eventTitle = event.title.toLowerCase();
	const eventDesc = event.description.toLowerCase();

	if (eventTitle.includes("workshop") || eventDesc.includes("workshop")) {
		const workshopMatches = typeReasons.filter((reason) => reason.includes("workshop") || reason.includes("hands-on") || reason.includes("practical"));
		if (workshopMatches.length > 0) {
			const uniqueReasons = [...new Set(workshopMatches)].slice(0, 2);
			reasons.push(`you <span class="text-purple-600 font-semibold">enjoyed</span> <span class="text-purple-600 font-semibold">${uniqueReasons.join(" and ")}</span> activities`);
		}
	}

	if (eventTitle.includes("networking") || eventDesc.includes("networking")) {
		const networkingMatches = typeReasons.filter((reason) => reason.includes("networking") || reason.includes("connections") || reason.includes("people"));
		if (networkingMatches.length > 0) {
			const uniqueReasons = [...new Set(networkingMatches)].slice(0, 2);
			reasons.push(`you <span class="text-purple-600 font-semibold">liked</span> <span class="text-purple-600 font-semibold">${uniqueReasons.join(" and ")}</span> opportunities`);
		}
	}

	if (eventTitle.includes("career") || eventDesc.includes("career")) {
		const careerMatches = typeReasons.filter((reason) => reason.includes("career") || reason.includes("professional") || reason.includes("job"));
		if (careerMatches.length > 0) {
			const uniqueReasons = [...new Set(careerMatches)].slice(0, 2);
			reasons.push(`you <span class="text-purple-600 font-semibold">valued</span> <span class="text-purple-600 font-semibold">${uniqueReasons.join(" and ")}</span> development`);
		}
	}

	if (eventTitle.includes("social") || eventDesc.includes("social")) {
		const socialMatches = typeReasons.filter((reason) => reason.includes("social") || reason.includes("fun") || reason.includes("friends"));
		if (socialMatches.length > 0) {
			const uniqueReasons = [...new Set(socialMatches)].slice(0, 2);
			reasons.push(`you <span class="text-purple-600 font-semibold">enjoyed</span> <span class="text-purple-600 font-semibold">${uniqueReasons.join(" and ")}</span> activities`);
		}
	}

	if (eventTitle.includes("tech") || eventDesc.includes("tech") || eventTitle.includes("coding") || eventDesc.includes("coding")) {
		const techMatches = typeReasons.filter((reason) => reason.includes("tech") || reason.includes("technical") || reason.includes("coding") || reason.includes("programming"));
		if (techMatches.length > 0) {
			const uniqueReasons = [...new Set(techMatches)].slice(0, 2);
			reasons.push(`you <span class="text-purple-600 font-semibold">liked</span> <span class="text-purple-600 font-semibold">${uniqueReasons.join(" and ")}</span> events`);
		}
	}

	// quality-based recommendations
	if (event.points >= 50) {
		const qualityMatches = qualityReasons.filter((reason) => reason.includes("popular") || reason.includes("high-rated") || reason.includes("quality") || reason.includes("valuable") || reason.includes("worthwhile"));
		if (qualityMatches.length > 0) {
			const uniqueReasons = [...new Set(qualityMatches)].slice(0, 2);
			reasons.push(`you <span class="text-orange-600 font-semibold">liked</span> <span class="text-pink-600 font-semibold">${uniqueReasons.join(" and ")}</span> events`);
		}
	}

	// Fallback with actual feedback data
	if (reasons.length === 0) {
		if (likedReasons.length > 0) {
			// Show the most common reasons the user liked events
			const reasonCounts = {};
			likedReasons.forEach((reason) => {
				reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
			});
			const topReasons = Object.entries(reasonCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 3)
				.map(([reason]) => reason);

			reasons.push(`you <span class="text-indigo-600 font-semibold">liked</span> events with attributes such as <span class="text-indigo-600 font-semibold">${topReasons.join(", ")}</span> and more`);
		} else {
			return "This event was recommended based on your overall preferences and feedback patterns.";
		}
	}

	// Build detailed explanation with multiple reasons
	if (reasons.length === 1) {
		return `This event was recommended because ${reasons[0]}.`;
	} else if (reasons.length === 2) {
		return `This event was recommended because ${reasons[0]} and ${reasons[1]}.`;
	} else {
		const lastReason = reasons.pop();
		return `This event was recommended because ${reasons.join(", ")}, and ${lastReason}.`;
	}
}
