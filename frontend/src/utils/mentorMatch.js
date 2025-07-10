// Weight settings for different features in the matching algorithm
const FEATURE_WEIGHTS = {
	skills: 0.4,
	interests: 0.3,
	ai_interest: 0.1,
	experience_years: 0.1,
	preferred_meeting: 0.1,
};

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

function encodeExperience(user, maxYears = 5) {
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
	const expVec = encodeExperience(user, globalSkills.length).map((v) => v * FEATURE_WEIGHTS.experience_years);
	const meetVec = encodeMeeting(user).map((v) => v * FEATURE_WEIGHTS.preferred_meeting);
	const fullVec = [...skillVec, ...interestVec, ...aiVec, ...expVec, ...meetVec];
	return fullVec;
}

// Calculates how similar two vectors are using cosine similarity
function cosineSimilarity(vecA, vecB) {
	const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
	const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
	const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
	if (!magnitudeA || !magnitudeB) return 0;
	return dotProduct / (magnitudeA * magnitudeB);
}

// Finds and returns the top mentor matches based on similarity to the current user
export function getTopMentorMatches(currentUser, mentors, globalSkills, globalInterests, topN = 5) {
	const currentUserVector = vectorizeUser(currentUser, globalSkills, globalInterests);

	const scoredMentors = mentors.map((mentor) => {
		const mentorVector = vectorizeUser(mentor, globalSkills, globalInterests);
		const similarityScore = cosineSimilarity(currentUserVector, mentorVector);
		return { mentor, score: similarityScore };
	});

	// Sort by descending score and return top
	const sorted = scoredMentors.sort((a, b) => b.score - a.score);
	return sorted.slice(0, topN);
}
