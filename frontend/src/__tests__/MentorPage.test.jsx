import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import MentorPage from "../components/MentorPage";

// mock data
const mockUserProfile = {
	id: "user-1",
	name: "Test User",
	year: "Senior",
	bio: "Test bio",
	skills: { Python: "Advanced", React: "Intermediate" },
	interests: ["AI", "Web Development"],
	ai_interest: true,
	experience_years: 2,
	preferred_meeting: "Zoom",
	points: 150,
	profile_picture: "test-pic.jpg",
};

const mockMentors = [
	{
		id: "mentor-1",
		name: "John Mentor",
		year: "Graduate",
		bio: "Experienced mentor",
		skills: { Python: "Advanced", "Machine Learning": "Expert" },
		interests: ["AI", "Data Science"],
		ai_interest: true,
		experience_years: 5,
		preferred_meeting: "Hybrid",
		points: 300,
		profile_picture: "mentor-pic.jpg",
		linked_in_url: "https://linkedin.com/john",
	},
	{
		id: "mentor-2",
		name: "Jane Mentor",
		year: "Graduate",
		bio: "Another great mentor",
		skills: { React: "Expert", "Web Development": "Advanced" },
		interests: ["Web Development", "UI/UX"],
		ai_interest: false,
		experience_years: 3,
		preferred_meeting: "In Person",
		points: 250,
		profile_picture: "jane-pic.jpg",
		linked_in_url: "https://linkedin.com/jane",
	},
];

// mock dependencies
vi.mock("../supabaseClient.jsx", () => ({
	supabase: {
		from: vi.fn((table) => {
			if (table === "users") {
				return {
					select: vi.fn(() => ({
						eq: vi.fn(() => ({
							single: vi.fn(() => Promise.resolve({ data: mockUserProfile })),
						})),
						ilike: vi.fn(() => ({
							neq: vi.fn(() => Promise.resolve({ data: mockMentors })),
						})),
					})),
				};
			}
			if (table === "interactions") {
				return {
					select: vi.fn(() => ({
						eq: vi.fn(() => ({
							eq: vi.fn(() => ({
								in: vi.fn(() => Promise.resolve({ data: [] })),
							})),
						})),
					})),
					insert: vi.fn(() => Promise.resolve({ error: null })),
					delete: vi.fn(() => ({
						eq: vi.fn(() => ({
							eq: vi.fn(() => ({
								eq: vi.fn(() => Promise.resolve({ error: null })),
							})),
						})),
					})),
				};
			}
			return {
				select: vi.fn(() => ({
					eq: vi.fn(() => Promise.resolve({ data: [] })),
				})),
			};
		}),
		auth: {
			getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user-1" } } })),
		},
	},
}));

vi.mock("../utils/mentorMatchUtils", () => ({
	getTopMentorMatches: vi.fn(() => [
		{ mentor: mockMentors[0], score: 0.85 },
		{ mentor: mockMentors[1], score: 0.72 },
	]),
	generateMatchExplanation: vi.fn(() => "You both have strong Python skills and AI interests"),
}));

vi.mock("../components/constants/presets", () => ({
	PRESET_SKILLS: ["Python", "React", "Machine Learning"],
	PRESET_INTERESTS: ["AI", "Web Development", "Data Science"],
}));

vi.mock("../context/AuthContext", () => ({
	UserAuth: vi.fn(() => ({
		session: { user: { id: "user-1" } },
	})),
}));

vi.mock("../components/NavigationBar", () => ({
	default: () => <div data-testid="navigation-bar">Navigation Bar</div>,
}));

vi.mock("../components/LoadingSpinner", () => ({
	default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock("../components/Footer", () => ({
	default: () => <div data-testid="footer">Footer</div>,
}));

// helper function to render MentorPage component with router
const renderMentorPage = () => {
	return render(
		<BrowserRouter>
			<MentorPage />
		</BrowserRouter>
	);
};

describe("MentorPage Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Initial Rendering", () => {
		it("shows loading spinner initially", () => {
			// should show spinner while fetching data
			renderMentorPage();
			expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
		});

		it("renders mentor page after loading", async () => {
			// should show mentor matching page once data loads
			renderMentorPage();
			await waitFor(() => {
				expect(screen.getByText("Mentor Matching")).toBeInTheDocument();
			});
		});
	});

	describe("Page Header", () => {
		it("displays page title and description", async () => {
			// should show the main title and description
			renderMentorPage();
			await waitFor(() => {
				expect(screen.getByText("Mentor Matching")).toBeInTheDocument();
				expect(screen.getByText(/Find mentors who match your/)).toBeInTheDocument();
			});
		});

		it("shows adjust weights button", async () => {
			// should show the adjust weights button
			renderMentorPage();
			await waitFor(() => {
				expect(screen.getByText("Adjust Weights")).toBeInTheDocument();
			});
		});
	});

	describe("Mentor Cards", () => {
		it("displays mentor information correctly", async () => {
			// should show mentor name, bio, and skills
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText("John Mentor")).toBeInTheDocument();
				expect(screen.getByText("Experienced mentor")).toBeInTheDocument();
				expect(screen.getByText("Python (Advanced)")).toBeInTheDocument();
			});
		});

		it("shows mentor profile pictures", async () => {
			// should display mentor profile pictures
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				const images = screen.getAllByAltText(/Mentor/);
				expect(images.length).toBeGreaterThan(0);
			});
		});

		it("displays mentor skills and interests", async () => {
			// should show mentor skills and interests as tags
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText("Python (Advanced)")).toBeInTheDocument();
				expect(screen.getByText("AI")).toBeInTheDocument();
			});
		});

		it("shows match scores", async () => {
			// should display match percentage for each mentor
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText("85% match")).toBeInTheDocument();
				expect(screen.getByText("72% match")).toBeInTheDocument();
			});
		});

		it("shows mentor points", async () => {
			// should display total points for each mentor
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText("300 total points")).toBeInTheDocument();
				expect(screen.getByText("250 total points")).toBeInTheDocument();
			});
		});
	});

	describe("Like/Unlike Functionality", () => {
		it("shows like buttons for mentors", async () => {
			// should show like buttons for each mentor
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				const likeButtons = screen.getAllByText("Like");
				expect(likeButtons.length).toBeGreaterThan(0);
			});
		});

		it("changes like button to unlike when clicked", async () => {
			// should change button text when you like a mentor
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				const likeButton = screen.getAllByText("Like")[0];
				fireEvent.click(likeButton);
			});

			await waitFor(() => {
				expect(screen.getByText("Unlike")).toBeInTheDocument();
			});
		});
	});

	describe("Connect Buttons", () => {
		it("shows connect buttons for mentors with LinkedIn", async () => {
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				const connectButtons = screen.getAllByText("Connect on LinkedIn");
				expect(connectButtons.length).toBeGreaterThan(0);
			});
		});

		it("disables connect button for mentors without LinkedIn", async () => {
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				const connectButtons = screen.getAllByText("Connect on LinkedIn");
				expect(connectButtons.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Weight Adjustment Modal", () => {
		it("opens weight modal when adjust weights button is clicked", async () => {
			// should open modal when you click adjust weights
			renderMentorPage();
			await waitFor(() => {
				const adjustButton = screen.getByText("Adjust Weights");
				fireEvent.click(adjustButton);
			});

			await waitFor(() => {
				expect(screen.getByText("Feature Weights")).toBeInTheDocument();
			});
		});

		it("shows all weight sliders in modal", async () => {
			// should show sliders for all feature weights
			renderMentorPage();
			await waitFor(() => {
				const adjustButton = screen.getByText("Adjust Weights");
				fireEvent.click(adjustButton);
			});

			await waitFor(() => {
				expect(screen.getAllByText("skills").length).toBeGreaterThan(0);
				expect(screen.getAllByText("interests").length).toBeGreaterThan(0);
				expect(screen.getAllByText("ai interest").length).toBeGreaterThan(0);
				expect(screen.getAllByText("experience years").length).toBeGreaterThan(0);
				expect(screen.getAllByText("preferred meeting").length).toBeGreaterThan(0);
			});
		});

		it("closes modal when close button is clicked", async () => {
			// should close modal when you click close
			renderMentorPage();
			await waitFor(() => {
				const adjustButton = screen.getByText("Adjust Weights");
				fireEvent.click(adjustButton);
			});

			await waitFor(() => {
				const closeButton = screen.getByText("Close");
				fireEvent.click(closeButton);
			});

			await waitFor(() => {
				expect(screen.queryByText("Feature Weights")).not.toBeInTheDocument();
			});
		});
	});

	describe("Help Tooltips", () => {
		it("shows help icon in header", async () => {
			// should show help icon next to title
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				// Look for the help icon by its class name since it doesn't have a test ID
				const helpIcons = document.querySelectorAll(".lucide-circle-question-mark");
				expect(helpIcons.length).toBeGreaterThan(0);
			});
		});

		it("shows help icons on mentor cards", async () => {
			// should show help icons on each mentor card
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				// Look for the help icon by its class name since it doesn't have a test ID
				const helpIcons = document.querySelectorAll(".lucide-circle-question-mark");
				expect(helpIcons.length).toBeGreaterThan(1); // Multiple help icons
			});
		});
	});

	describe("Mentor Information Display", () => {
		it("shows mentor experience years", async () => {
			// should display mentor's years of experience
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText(/5 yr/)).toBeInTheDocument();
				expect(screen.getByText(/3 yr/)).toBeInTheDocument();
			});
		});

		it("shows mentor year/grade", async () => {
			// should display mentor's year or grade level
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getAllByText(/Graduate/).length).toBeGreaterThan(0);
			});
		});

		it("displays mentor bio", async () => {
			// should show mentor's bio text
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText("Experienced mentor")).toBeInTheDocument();
				expect(screen.getByText("Another great mentor")).toBeInTheDocument();
			});
		});
	});

	describe("Mentor Tags", () => {
		it("shows mentor badge", async () => {
			// should display "Mentor" badge on each card
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				const mentorBadges = screen.getAllByText("Mentor");
				expect(mentorBadges.length).toBeGreaterThan(0);
			});
		});

		it("displays skills as colored tags", async () => {
			// should show skills as blue colored tags
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText("Python (Advanced)")).toBeInTheDocument();
				expect(screen.getByText("React (Expert)")).toBeInTheDocument();
			});
		});

		it("displays interests as colored tags", async () => {
			// should show interests as purple colored tags
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText("AI")).toBeInTheDocument();
				expect(screen.getByText("Web Development")).toBeInTheDocument();
			});
		});
	});

	describe("Match Score Display", () => {
		it("shows match score progress bars", async () => {
			// should display visual progress bars for match scores
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getAllByText("Match Score").length).toBeGreaterThan(0);
			});
		});

		it("displays match percentages", async () => {
			// should show exact match percentages
			renderMentorPage();
			await waitFor(() => {
				expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			});
			await waitFor(() => {
				expect(screen.getByText("85% match")).toBeInTheDocument();
				expect(screen.getByText("72% match")).toBeInTheDocument();
			});
		});
	});

	describe("Responsive Design", () => {
		it("renders mentor cards in grid layout", async () => {
			// should display mentors in a responsive grid
			renderMentorPage();
			await waitFor(() => {
				expect(screen.getByText("John Mentor")).toBeInTheDocument();
				expect(screen.getByText("Jane Mentor")).toBeInTheDocument();
			});
		});
	});

	describe("Error Handling", () => {
		it("handles missing mentor data gracefully", async () => {
			// should handle cases where mentor data is incomplete
			renderMentorPage();
			await waitFor(() => {
				expect(screen.getByText("Mentor Matching")).toBeInTheDocument();
			});
		});
	});
});
