// unit tests for mentor-match utils
import { describe, it, expect } from "vitest";
import { encodeSkills, encodeInterests, encodeAI, encodeExperience, encodeMeeting, vectorizeUser, cosineSimilarity, buildAdjacencyList, personalizedPageRank, getTopMentorMatches } from "../utils/mentorMatchUtils";

// shared constants
const SKILLS = ["Python", "React", "C++"];
const INTERESTS = ["AI", "Web", "Games"];

// default weight set used everywhere
const W = {
	skills: 0.4,
	interests: 0.3,
	ai_interest: 0.1,
	experience_years: 0.1,
	preferred_meeting: 0.1,
};

// fixture users 
const user = {
	skills: { Python: "Advanced", React: "Intermediate" },
	interests: ["AI", "Games"],
	ai_interest: true,
	experience_years: 2,
	preferred_meeting: "Zoom",
};

const mentor1 = {
	id: "m1",
	skills: { Python: "Advanced", "C++": "Intermediate" },
	interests: ["AI", "Web"],
	ai_interest: true,
	experience_years: 4,
	preferred_meeting: "Hybrid",
};

const mentor2 = {
	id: "m2",
	skills: { React: "Beginner", "C++": "Beginner" },
	interests: ["Games"],
	ai_interest: false,
	experience_years: 1,
	preferred_meeting: "In Person",
};

// encode helpers
describe("encode helpers", () => {
	it("encodeSkills maps levels", () => {
		expect(encodeSkills(user, SKILLS)).toEqual([1, 0.66, 0]);
	});

	it("encodeInterests flags membership", () => {
		expect(encodeInterests(user, INTERESTS)).toEqual([1, 0, 1]);
	});

	it("encodeAI returns 1 or 0", () => {
		expect(encodeAI(user)).toEqual([1]);
		expect(encodeAI({ ai_interest: false })).toEqual([0]);
	});

	it("encodeExperience normalizes years", () => {
		expect(encodeExperience(user)).toEqual([0.4]); // 2 / 5
		expect(encodeExperience({ experience_years: 99 })).toEqual([1]); // capped
	});

	it("encodeMeeting one-hot encodes option", () => {
		expect(encodeMeeting(user)).toEqual([1, 0, 0]); // Zoom chosen
	});
});

// vector + similarity
describe("vectorizeUser + cosineSimilarity", () => {
	it("vectorizeUser builds full weighted vector", () => {
		const vec = vectorizeUser(user, SKILLS, INTERESTS, W);
		const expectedLen = SKILLS.length + INTERESTS.length + 1 + 1 + 3; // 3+3+1+1+3
		expect(vec.length).toBe(expectedLen);
	});

	it("cosineSimilarity identical vec → 1", () => {
		const v = vectorizeUser(user, SKILLS, INTERESTS, W);
		expect(cosineSimilarity(v, v)).toBeCloseTo(1);
	});
});

// graph + PageRank
describe("buildAdjacencyList + personalizedPageRank", () => {
	const mentors = [mentor1, mentor2];
	const vectors = [
		vectorizeUser(user, SKILLS, INTERESTS, W), // index 0 = current user
		vectorizeUser(mentor1, SKILLS, INTERESTS, W),
		vectorizeUser(mentor2, SKILLS, INTERESTS, W),
	];
	const likesMap = { m1: 3 }; // user liked mentor1 three times

	const adj = buildAdjacencyList(vectors, mentors, likesMap);

	it("returns adjacency rows equal to node count", () => {
		expect(adj.length).toBe(3);
	});

	it("each node’s outgoing weights sum to ≤ 1", () => {
		adj.forEach((edges) => {
			const sum = edges.reduce((s, e) => s + e.weight, 0);
			expect(sum).toBeLessThanOrEqual(1.001);
		});
	});

	it("personalizedPageRank keeps start node highest", () => {
		const rank = personalizedPageRank(adj, 0);
		const max = Math.max(...rank);
		expect(rank[0]).toBeCloseTo(max);
	});
});

// top mentor matcher
describe("getTopMentorMatches", () => {
	const likesMap = { m1: 5 }; // max likes on mentor1
	const results = getTopMentorMatches(user, [mentor1, mentor2], SKILLS, INTERESTS, likesMap, 2, W);

	it("returns mentors sorted by score", () => {
		expect(results.map((r) => r.mentor.id)).toEqual(["m1", "m2"]);
		expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
	});

	it("respects topN limit", () => {
		expect(results.length).toBe(2);
	});
});
