// unit tests for feedbackUtils – short, clear, and a hair more detail
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FEEDBACK_TABLE, saveUserFeedback, getUserFeedbackMap, getLocationCategory, euclidean, getEventFeedbackVectors, getUserPreferenceVector, clusterEventsKMeans, recommendEventsForUser } from "../utils/feedbackUtils";

// fake Supabase client
const fromSpy = vi.fn(); // tracks table names
const upsertSpy = vi.fn(async () => ({ error: null })); // simulates insert

vi.mock("../supabaseClient", () => ({
	supabase: {
		from: (table) => {
			fromSpy(table); // record table used
			return {
				select: () => {
					// minimal rows to unblock helper logic
					if (table === "event_registrations") return { data: [{ event_id: 1, user_id: "u1" }] };

					if (table === "events")
						return {
							data: [
								{ id: 1, location: "Zoom", duration: 1 },
								{ id: 2, location: "Thomas Building Room 101", duration: 3 },
							],
						};

					if (table === "event_feedback") return { data: [] };

					return { data: [] };
				},
				upsert: upsertSpy, // pretend write succeeds
			};
		},
	},
}));

// mock building list so getLocationCategory works
vi.mock("../components/constants/academicBuildings", () => ({
	academicBuildings: ["thomas building", "boucke building", "hub"],
}));

// helper function tests
describe("helpers", () => {
	it("getLocationCategory maps strings to tags", () => {
		expect(getLocationCategory("Zoom link")).toBe("loc:virtual");
		expect(getLocationCategory("Thomas Building Room 200")).toBe("loc:academic");
		expect(getLocationCategory("Mystery Hall")).toBe("loc:other");
	});

	it("euclidean returns 0 for identical vectors", () => {
		expect(euclidean([1, 2], [1, 2])).toBe(0);
	});
});

// supabase write / read helpers
describe("Supabase interactions", () => {
	beforeEach(() => {
		fromSpy.mockClear();
		upsertSpy.mockClear();
	});

	it("saveUserFeedback calls correct table with correct row", async () => {
		await saveUserFeedback("u1", 99, true, ["fun"]);

		expect(fromSpy).toHaveBeenCalledWith(FEEDBACK_TABLE);
		expect(upsertSpy).toHaveBeenCalledWith({ user_id: "u1", event_id: 99, liked: true, reasons: ["fun"] }, { onConflict: ["user_id", "event_id"] });
	});

	it("getUserFeedbackMap returns an object map", async () => {
		const map = await getUserFeedbackMap();
		expect(map).toBeTypeOf("object");
	});
});

// user preference vector
describe("getUserPreferenceVector", () => {
	it("normalizes reason counts into fractions", () => {
		const fb = {
			u1: {
				1: { liked: true, reasons: new Set(["fun", "food"]) },
				2: { liked: true, reasons: new Set(["fun"]) },
			},
		};
		expect(getUserPreferenceVector("u1", fb)).toEqual({ fun: 2 / 3, food: 1 / 3 });
	});

	it("returns empty obj if user has no likes", () => {
		expect(getUserPreferenceVector("u1", { u1: {} })).toEqual({});
	});
});

// simple K-means clustering sanity checks
describe("clusterEventsKMeans", () => {
	const vecs = { 1: { a: 1 }, 2: { a: 1 }, 3: { a: 0 }, 4: { a: 0 } };

	it("groups similar vecs into clusters", () => {
		const cl = clusterEventsKMeans(vecs, 2);
		expect(Object.values(cl).flat().sort()).toEqual(["1", "2", "3", "4"]);
	});

	it("returns empty obj on empty input", () => {
		expect(clusterEventsKMeans({}, 3)).toEqual({});
	});
});

// build event vectors with reasons + location metadata
describe("getEventFeedbackVectors", () => {
	it("adds reason + loc tags to each event", async () => {
		const fb = { u1: { 1: { liked: true, reasons: new Set(["fun"]) } } };
		const vec = await getEventFeedbackVectors(fb, [1, 2]);

		expect(vec["1"]).toMatchObject({ fun: 1, "loc:virtual": 1 });
		expect(vec["2"]).toHaveProperty("loc:academic", 1);
	});
});

// final recommend logic
describe("recommendEventsForUser", () => {
	const clusterMap = { 0: ["2"] };
	const vectors = { 2: { fun: 1 } };

	it("suggests unseen event that matches prefs", () => {
		const fb = { u1: { 1: { liked: true, reasons: new Set(["fun"]) } } };
		expect(recommendEventsForUser("u1", fb, clusterMap, vectors)).toEqual(["2"]);
	});

	it("returns [] when user already interacted", () => {
		const fb = { u1: { 2: { liked: true, reasons: new Set(["fun"]) } } };
		expect(recommendEventsForUser("u1", fb, clusterMap, vectors)).toEqual([]);
	});
});
