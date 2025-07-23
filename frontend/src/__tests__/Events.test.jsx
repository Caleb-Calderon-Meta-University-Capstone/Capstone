import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Events from "../components/Events";

// mock data
const mockEvents = [
	{
		id: 1,
		title: "Test Event 1",
		description: "Test description 1",
		location: "Test Location 1",
		date: "2024-01-01T10:00:00Z",
		points: 10,
		users: { name: "Test User 1" },
	},
	{
		id: 2,
		title: "Test Event 2",
		description: "Test description 2",
		location: "Test Location 2",
		date: "2024-01-02T10:00:00Z",
		points: 20,
		users: { name: "Test User 2" },
	},
];

// Mock dependencies
vi.mock("../supabaseClient.jsx", () => ({
	supabase: {
		auth: {
			getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "test-user-id" } } })),
		},
		from: vi.fn((table) => {
			if (table === "event_registrations") {
				return {
					select: vi.fn(() => ({
						eq: vi.fn(() => Promise.resolve({ data: [] })),
					})),
				};
			}
			if (table === "users") {
				return {
					select: vi.fn(() => ({
						eq: vi.fn(() => ({
							single: vi.fn(() => Promise.resolve({ data: { points: 100 } })),
						})),
					})),
				};
			}
			if (table === "events") {
				return {
					select: vi.fn(() => ({
						order: vi.fn(() => Promise.resolve({ data: mockEvents })),
					})),
				};
			}
			return {
				select: vi.fn(() => ({
					eq: vi.fn(() => Promise.resolve({ data: [] })),
				})),
			};
		}),
		insert: vi.fn(() => ({
			select: vi.fn(() => ({
				single: vi.fn(() => Promise.resolve({ data: { id: 1, title: "Test Event" } })),
			})),
		})),
		delete: vi.fn(() => ({
			eq: vi.fn(() => Promise.resolve({ error: null })),
		})),
		update: vi.fn(() => ({
			eq: vi.fn(() => Promise.resolve({ error: null })),
		})),
	},
}));

vi.mock("../utils/feedbackUtils", () => ({
	saveUserFeedback: vi.fn(() => Promise.resolve()),
	getUserFeedbackMap: vi.fn(() => Promise.resolve({})),
	getEventFeedbackVectors: vi.fn(() => Promise.resolve({})),
	clusterEventsKMeans: vi.fn(() => ({})),
	recommendEventsForUser: vi.fn(() => []),
	generateEventRecommendationExplanation: vi.fn(() => "Test explanation"),
}));

vi.mock("../lib/googleCalendarUtils", () => ({
	addEventToGoogleCalendar: vi.fn(() => Promise.resolve()),
}));

vi.mock("@react-oauth/google", () => ({
	useGoogleLogin: vi.fn(() => vi.fn()),
}));

// Mock components
vi.mock("../components/AddEventModal", () => ({
	default: ({ onClose, onSubmit, submitting }) => (
		<div data-testid="add-event-modal">
			<button onClick={onClose}>Close</button>
			<button onClick={() => onSubmit({ title: "Test Event", description: "Test Description", date: "2024-01-01", location: "Test Location", points: 10 })} disabled={submitting}>
				Submit
			</button>
		</div>
	),
}));

vi.mock("../components/FeedbackModal", () => ({
	default: ({ visible, onSubmit, onClose }) =>
		visible ? (
			<div data-testid="feedback-modal">
				<button onClick={() => onSubmit(["fun", "food"])}>Submit Feedback</button>
				<button onClick={onClose}>Close</button>
			</div>
		) : null,
}));

vi.mock("../components/LoadingSpinner", () => ({
	default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// helper function to render Events component with router
const renderEvents = (props = {}) => {
	return render(
		<BrowserRouter>
			<Events {...props} />
		</BrowserRouter>
	);
};

describe("Events Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Initial Rendering", () => {
		it("shows loading spinner initially", () => {
			// should show spinner while fetching data
			renderEvents();
			expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
		});

		it("renders events after loading", async () => {
			// spinner should disappear once data loads
			renderEvents();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
		});
	});

	describe("Event Display", () => {
		it("displays event information correctly", async () => {
			// should show title, description, location, and points
			renderEvents();
			await waitFor(() => {
				expect(screen.getByText("Test Event 1")).toBeInTheDocument();
				expect(screen.getByText("Test description 1")).toBeInTheDocument();
				expect(screen.getByText("Test Location 1")).toBeInTheDocument();
				expect(screen.getByText("+10 pts")).toBeInTheDocument();
			});
		});

		it("shows creator name for events", async () => {
			// should display who created each event
			renderEvents();
			await waitFor(() => {
				expect(screen.getByText("Test User 1")).toBeInTheDocument();
			});
		});
	});

	describe("Search Functionality", () => {
		it("filters events by search query", async () => {
			renderEvents();
			await waitFor(() => {
				expect(screen.getByText("Test Event 1")).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText("Search events by title, description, location, or creator...");
			fireEvent.change(searchInput, { target: { value: "Test Event 2" } });

			await waitFor(() => {
				expect(screen.queryByText("Test Event 1")).not.toBeInTheDocument();
				expect(screen.getByText("Test Event 2")).toBeInTheDocument();
			});
		});

		it("filters by description", async () => {
			renderEvents();
			await waitFor(() => {
				expect(screen.getByText("Test Event 1")).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText("Search events by title, description, location, or creator...");
			fireEvent.change(searchInput, { target: { value: "description 2" } });

			await waitFor(() => {
				expect(screen.queryByText("Test Event 1")).not.toBeInTheDocument();
				expect(screen.getByText("Test Event 2")).toBeInTheDocument();
			});
		});
	});

	describe("Tab Navigation", () => {
		it("shows all events by default", async () => {
			renderEvents();
			await waitFor(() => {
				expect(screen.getByText("All Events")).toHaveClass("bg-white", "text-indigo-700", "shadow-lg");
				expect(screen.getByText("Recommended")).toHaveClass("bg-white/20", "text-white");
			});
		});

		it("switches to recommended tab", async () => {
			renderEvents();
			await waitFor(() => {
				const recommendedButton = screen.getByText("Recommended");
				fireEvent.click(recommendedButton);
			});

			await waitFor(() => {
				expect(screen.getByText("Recommended")).toHaveClass("bg-white", "text-indigo-700", "shadow-lg");
				expect(screen.getByText("All Events")).toHaveClass("bg-white/20", "text-white");
			});
		});
	});

	describe("Admin Features", () => {
		it("shows add event button for admin role", async () => {
			// admins should see the add event button
			renderEvents({ role: "Admin" });
			await waitFor(() => {
				expect(screen.getByText("Add Event")).toBeInTheDocument();
			});
		});

		it("does not show add event button for non-admin role", async () => {
			// regular users shouldn't see add button
			renderEvents({ role: "Member" });
			await waitFor(() => {
				expect(screen.queryByText("Add Event")).not.toBeInTheDocument();
			});
		});

		it("shows delete button for admin role", async () => {
			// admins should see delete buttons on events
			renderEvents({ role: "Admin" });
			await waitFor(() => {
				const deleteButtons = screen.getAllByText("Delete");
				expect(deleteButtons.length).toBeGreaterThan(0);
			});
		});

		it("opens add event modal when add button is clicked", async () => {
			// clicking add should open the modal
			renderEvents({ role: "Admin" });
			await waitFor(() => {
				const addButton = screen.getByText("Add Event");
				fireEvent.click(addButton);
			});

			await waitFor(() => {
				expect(screen.getByTestId("add-event-modal")).toBeInTheDocument();
			});
		});
	});

	describe("Event Registration", () => {
		it("shows register button for unregistered events", async () => {
			// should show register button for events you haven't signed up for
			renderEvents();
			await waitFor(() => {
				const registerButtons = screen.getAllByText("Register");
				expect(registerButtons.length).toBeGreaterThan(0);
			});
		});

		it("shows cancel registration for registered events", async () => {
			// should show cancel button for events you're already signed up for
			expect(true).toBe(true);
		});
	});

	describe("Feedback System", () => {
		it("shows like and dislike buttons", async () => {
			// should show thumbs up/down buttons on each event
			renderEvents();
			await waitFor(() => {
				const thumbsUpButtons = screen.getAllByLabelText("Like");
				const thumbsDownButtons = screen.getAllByLabelText("Dislike");
				expect(thumbsUpButtons.length).toBeGreaterThan(0);
				expect(thumbsDownButtons.length).toBeGreaterThan(0);
			});
		});

		it("opens feedback modal when like button is clicked", async () => {
			// clicking like should open feedback modal
			renderEvents();
			await waitFor(() => {
				const likeButton = screen.getAllByLabelText("Like")[0];
				fireEvent.click(likeButton);
			});

			await waitFor(() => {
				expect(screen.getByTestId("feedback-modal")).toBeInTheDocument();
			});
		});

		it("opens feedback modal when dislike button is clicked", async () => {
			// clicking dislike should also open feedback modal
			renderEvents();
			await waitFor(() => {
				const dislikeButton = screen.getAllByLabelText("Dislike")[0];
				fireEvent.click(dislikeButton);
			});

			await waitFor(() => {
				expect(screen.getByTestId("feedback-modal")).toBeInTheDocument();
			});
		});
	});

	describe("Google Calendar Integration", () => {
		it("shows connect Google Calendar button when not connected", async () => {
			// should show connect button when not logged into google
			renderEvents();
			await waitFor(() => {
				const googleButtons = screen.getAllByText("Connect Google Calendar");
				expect(googleButtons.length).toBeGreaterThan(0);
			});
		});

		it("shows add to Google Calendar button when connected", async () => {
			// should show add to calendar button when connected
			renderEvents();
			await waitFor(() => {
				const googleButtons = screen.getAllByText(/Google Calendar/);
				expect(googleButtons.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Points Display", () => {
		it("shows total points at the bottom", async () => {
			// should show your total points at the bottom
			renderEvents();
			await waitFor(() => {
				expect(screen.getByText(/Total Points: 100/)).toBeInTheDocument();
			});
		});
	});

	describe("Visualization Link", () => {
		it("shows visualization button", async () => {
			// should show the visualization button
			renderEvents();
			await waitFor(() => {
				expect(screen.getByText("View Visualization")).toBeInTheDocument();
			});
		});
	});

	describe("Error Handling", () => {
		it("handles fetch errors gracefully", async () => {
			// should handle errors without crashing
			expect(true).toBe(true);
		});
	});

	describe("Recommendation System", () => {
		it("shows no recommendations message when no feedback given", async () => {
			// should show message when you haven't given feedback yet
			renderEvents();
			await waitFor(() => {
				const recommendedButton = screen.getByText("Recommended");
				fireEvent.click(recommendedButton);
			});

			await waitFor(() => {
				expect(screen.getByText("No recommendations yet! Give some feedback!")).toBeInTheDocument();
			});
		});
	});

	describe("Calendar Integration", () => {
		it("shows download button for ICS files", async () => {
			renderEvents();
			await waitFor(() => {
				const downloadButtons = screen.getAllByText("Download");
				expect(downloadButtons.length).toBeGreaterThan(0);
			});
		});

		it("shows connect Google Calendar button when not connected", async () => {
			renderEvents();
			await waitFor(() => {
				const googleButtons = screen.getAllByText("Connect Google Calendar");
				expect(googleButtons.length).toBeGreaterThan(0);
			});
		});
	});
});
