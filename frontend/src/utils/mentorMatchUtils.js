import React from "react";

//Create a constant for the maximum years of experience to normalize against
const MAX_YEARS = 5;

// Create variable for meeting types to support
const MEETING_OPTIONS = ["Zoom", "In Person", "Hybrid"];

// Mapping of skill levels to numeric values based on proficiency
const SKILL_LEVEL_MAP = {
	Beginner: 0.33,
	Intermediate: 0.66,
	Advanced: 1.0,
};

// These functions turn parts of a user's profile into numbers; This helps us compare users and find the best mentor matches later.
export function encodeSkills(user, globalSkills) {
	return globalSkills.map((skill) => {
		const level = user.skills?.[skill];
		return SKILL_LEVEL_MAP[level] || 0;
	});
}

export function encodeInterests(user, globalInterests) {
	return globalInterests.map((interest) => (user.interests?.includes(interest) ? 1 : 0));
}

export function encodeAI(user) {
	return [user.ai_interest ? 1 : 0];
}

export function encodeExperience(user, maxYears = MAX_YEARS) {
	let years = 0;
	const raw = user.experience_years;
	if (raw != null) {
		const parsed = parseFloat(raw.toString());
		if (!isNaN(parsed)) {
			years = parsed;
		}
	}
	return [Math.min(years / maxYears, 1)];
}

export function encodeMeeting(user) {
	return MEETING_OPTIONS.map((option) => (user.preferred_meeting === option ? 1 : 0));
}

// Turns all parts of a user profile into one weighted number array for similarity comparison
export function vectorizeUser(user, globalSkills, globalInterests, weights) {
	const skillVec = encodeSkills(user, globalSkills).map((v) => v * weights.skills);
	const interestVec = encodeInterests(user, globalInterests).map((v) => v * weights.interests);
	const aiVec = encodeAI(user).map((v) => v * weights.ai_interest);
	const expVec = encodeExperience(user, MAX_YEARS).map((v) => v * weights.experience_years);
	const meetVec = encodeMeeting(user).map((v) => v * weights.preferred_meeting);
	return [...skillVec, ...interestVec, ...aiVec, ...expVec, ...meetVec];
}

// Calculates how similar two vectors are using cosine similarity
export function cosineSimilarity(vecA, vecB) {
	const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
	const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
	const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
	if (!magnitudeA || !magnitudeB) return 0;
	return dotProduct / (magnitudeA * magnitudeB);
}

// weights for blending simil. vs likes
const ALPHA_SIM = 0.6;
const BETA_LIKES = 0.4;
const MAX_LIKES = 5;

// weight for blending PPR vs cosine similarity (hybrid)
const ALPHA_BLEND = 0.6;

// Vector component sizes for user profile encoding
export const AI_VEC_LEN = 1;
export const EXPERIENCE_VEC_LEN = 1;
export const MEETING_VEC_LEN = MEETING_OPTIONS.length;

// Builds an adjacency list where each node represents a user/mentor,
// and edge weights are based on a blend of cosine similarity and like strength.
// Likes are only considered from the current user (index 0) to mentors.
export function buildAdjacencyList(vectors, mentors, likesMap) {
	if (!vectors.length || !mentors.length) return [];

	const N = vectors.length;
	const adj = Array.from({ length: N }, () => []);

	// i stands for current user, j for mentors
	for (let i = 0; i < N; i++) {
		let total = 0;
		for (let j = 0; j < N; j++) {
			if (i === j) continue;
			// dot product of vectors divided by the product of their magnitudes
			const wSim = cosineSimilarity(vectors[i], vectors[j]);
			let wLike = 0;
			// only consider likes when walking out of the current user node
			if (i === 0 && j > 0) {
				wLike = likesMap[mentors[j - 1].id] || 0;
				wLike = Math.min(wLike / MAX_LIKES, 1);
			}

			const weight = ALPHA_SIM * wSim + BETA_LIKES * wLike;
			if (weight > 0) {
				adj[i].push({ to: j, weight });
				total += weight;
			}
		}
		// normalize outgoing weights so they sum to 1
		if (total > 0) {
			adj[i] = adj[i].map(({ to, weight }) => ({ to, weight: weight / total }));
		}
	}
	return adj;
}

// Runs Personalized PageRank to score nodes based on proximity to a starting user.
// - adj: adjacency list representing the graph
// - startIndex: index of the starting node (usually current user)
// - damping: probability of continuing the walk (default 0.85)
// - maxIter: max number of iterations (default 100)
// - tol: convergence threshold (default 1e-6)
export function personalizedPageRank(adj, startIndex, { damping = 0.85, maxIter = 100, tol = 1e-6 } = {}) {
	const n = adj.length;
	const r = Array(n).fill(1 / n); // current scores
	const t = Array(n).fill(0); // teleport vector
	t[startIndex] = 1;
	const rNext = Array(n).fill(0); // next scores

	for (let iter = 0; iter < maxIter; iter++) {
		rNext.fill(0);

		// distribute rank through edges
		for (let i = 0; i < n; i++) {
			for (const { to, weight } of adj[i]) {
				rNext[to] += damping * r[i] * weight;
			}
		}

		// apply teleportation to starting node
		for (let i = 0; i < n; i++) {
			rNext[i] += (1 - damping) * t[i];
		}

		// check convergence
		let diff = 0;
		for (let i = 0; i < n; i++) {
			diff += Math.abs(rNext[i] - r[i]);
			r[i] = rNext[i];
		}
		if (diff < tol) break;
	}
	return r;
}

// Finds the best mentors for a user by scoring them using a hybrid of Personalized PageRank and cosine similarity
export function getTopMentorMatches(currentUser, mentors, globalSkills, globalInterests, likesMap = {}, topN = 10, weights = { skills: 0.4, interests: 0.3, ai_interest: 0.1, experience_years: 0.1, preferred_meeting: 0.1 }) {
	// 1. Vectorize currentUser + mentors for PPR graph
	const users = [currentUser, ...mentors];
	const vectors = users.map((u) => vectorizeUser(u, globalSkills, globalInterests, weights));

	// 2. Build graph & run PageRank
	const adj = buildAdjacencyList(vectors, mentors, likesMap);
	const ranks = personalizedPageRank(adj, 0);

	// 3. Normalize PPR scores over mentors only
	const mentorRanks = ranks.slice(1);
	const maxRank = Math.max(...mentorRanks);
	const pprScores = mentorRanks.map((r) => (maxRank > 0 ? r / maxRank : 0));

	// 4. Compute raw cosine similarity scores
	const vUser = vectorizeUser(currentUser, globalSkills, globalInterests, weights);
	const cosScores = mentors.map((m) => cosineSimilarity(vUser, vectorizeUser(m, globalSkills, globalInterests, weights)));

	// 5. Blend PPR + cosine for final score
	const final = mentors.map((mentor, i) => ({
		mentor,
		score: ALPHA_BLEND * pprScores[i] + (1 - ALPHA_BLEND) * cosScores[i],
	}));

	// 6. Sort, slice to topN, and return
	return final.sort((a, b) => b.score - a.score).slice(0, topN);
}
// function for joining an array of strings into list
function joinWithCommasAndAnd(items) {
	if (items.length === 1) {
		return items[0];
	}
	if (items.length === 2) {
		return React.createElement(React.Fragment, null, items[0], " and ", items[1]);
	}
	return React.createElement(React.Fragment, null, ...items.slice(0, -1).map((item, idx) => [React.createElement(React.Fragment, { key: idx }, item, idx < items.length - 2 ? ", " : ", and ")]), items[items.length - 1]);
}

// Generates an explanation for why a user was matched with a mentor
export function generateMatchExplanation(user, mentor) {
	const reasons = [];

	// shared skills - up to 2
	if (user.skills && mentor.skills) {
		const sharedSkills = Object.keys(user.skills)
			.filter((s) => mentor.skills[s])
			.slice(0, 2);
		if (sharedSkills.length === 1) {
			reasons.push(React.createElement(React.Fragment, { key: "skills-1" }, "you both know ", React.createElement("span", { className: "text-indigo-600 font-semibold" }, sharedSkills[0])));
		} else if (sharedSkills.length === 2) {
			reasons.push(React.createElement(React.Fragment, { key: "skills-2" }, "you both know ", React.createElement("span", { className: "text-indigo-600 font-semibold" }, sharedSkills[0]), " and ", React.createElement("span", { className: "text-indigo-600 font-semibold" }, sharedSkills[1])));
		}
	}

	// shared interests - up to 2
	if (user.interests && mentor.interests) {
		const sharedInterests = user.interests.filter((i) => mentor.interests.includes(i)).slice(0, 2);
		if (sharedInterests.length === 1) {
			reasons.push(React.createElement(React.Fragment, { key: "interest-1" }, "you both are interested in ", React.createElement("span", { className: "text-purple-600 font-semibold" }, sharedInterests[0])));
		} else if (sharedInterests.length === 2) {
			reasons.push(React.createElement(React.Fragment, { key: "interest-2" }, "you both are interested in ", React.createElement("span", { className: "text-purple-600 font-semibold" }, sharedInterests[0]), " and ", React.createElement("span", { className: "text-purple-600 font-semibold" }, sharedInterests[1])));
		}
	}

	// preffered meeting meeting
	if (user.preferred_meeting && user.preferred_meeting === mentor.preferred_meeting) {
		reasons.push(React.createElement(React.Fragment, { key: "meeting" }, "you both prefer ", React.createElement("span", { className: "text-teal-600 font-semibold" }, user.preferred_meeting.toLowerCase()), " sessions"));
	}

	// ai interest
	if (user.ai_interest && mentor.ai_interest) {
		reasons.push(React.createElement(React.Fragment, { key: "ai" }, "you’re both interested in ", React.createElement("span", { className: "text-pink-600 font-semibold" }, "AI")));
	}

	// fallback
	if (reasons.length === 0) {
		return React.createElement(React.Fragment, null, "We matched you based on ", React.createElement("span", { className: "font-semibold" }, "overall compatibility"), ".");
	}

	// build final sentence
	const list = joinWithCommasAndAnd(reasons);
	return React.createElement(React.Fragment, null, "We matched you because ", list, ".");
}
