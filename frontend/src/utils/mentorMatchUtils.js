// Weight settings for different features in the matching algorithm
const FEATURE_WEIGHTS = {
	skills: 0.4,
	interests: 0.3,
	ai_interest: 0.1,
	experience_years: 0.1,
	preferred_meeting: 0.1,
};

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
function encodeSkills(user, globalSkills) {
	return globalSkills.map((skill) => {
		const level = user.skills?.[skill];
		return SKILL_LEVEL_MAP[level] || 0;
	});
}

function encodeInterests(user, globalInterests) {
	return globalInterests.map((interest) => (user.interests?.includes(interest) ? 1 : 0));
}

function encodeAI(user) {
	return [user.ai_interest ? 1 : 0];
}

function encodeExperience(user, maxYears = MAX_YEARS) {
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

function encodeMeeting(user) {
	return MEETING_OPTIONS.map((option) => (user.preferred_meeting === option ? 1 : 0));
}

// Turns all parts of a user profile into one weighted number array for similarity comparison
function vectorizeUser(user, globalSkills, globalInterests) {
	const skillVec = encodeSkills(user, globalSkills).map((v) => v * FEATURE_WEIGHTS.skills);
	const interestVec = encodeInterests(user, globalInterests).map((v) => v * FEATURE_WEIGHTS.interests);
	const aiVec = encodeAI(user).map((v) => v * FEATURE_WEIGHTS.ai_interest);
	const expVec = encodeExperience(user, MAX_YEARS).map((v) => v * FEATURE_WEIGHTS.experience_years);
	const meetVec = encodeMeeting(user).map((v) => v * FEATURE_WEIGHTS.preferred_meeting);
	return [...skillVec, ...interestVec, ...aiVec, ...expVec, ...meetVec];
}

// Calculates how similar two vectors are using cosine similarity
function cosineSimilarity(vecA, vecB) {
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

// Build adjacency list for Personalized PageRank with boost for liked mentors, creates the graph structure
function buildAdjacencyList(vectors, mentors, likesMap) {
	const N = vectors.length;
	const adj = Array.from({ length: N }, () => []);

	for (let i = 0; i < N; i++) {
		let total = 0;
		for (let j = 0; j < N; j++) {
			if (i === j) continue;

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
			adj[i] = adj[i].map(({ to, weight }) => ({
				to,
				weight: weight / total,
			}));
		}
	}
	return adj;
}

// Finds top connections starting from one user by spreading scores through the graph
function personalizedPageRank(adj, startIndex, { damping = 0.85, maxIter = 100, tol = 1e-6 } = {}) {
	const N = adj.length;
	const r = Array(N).fill(1 / N);
	const t = Array(N).fill(0);
	t[startIndex] = 1;
	const rNext = Array(N).fill(0);
}
