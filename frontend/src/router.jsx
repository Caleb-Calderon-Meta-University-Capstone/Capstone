import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Signup from "./components/Signup.jsx";
import Signin from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import App from "./App.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import EventsPage from "./components/EventsPage.jsx";
import LeaderboardPage from "./components/LeaderboardPage.jsx";
import MemberPage from "./components/Members.jsx";
import MemberCardPage from "./components/MemberCardPage.jsx";
import ProfilePage from "./components/Profile.jsx";
import EditPage from "./components/EditProfile.jsx";
import MentorPage from "./components/MentorPage.jsx";
import LandingPage from "./components/LandingPage.jsx";
import EventsVisualization from "./components/visualization/EventsVisualization.jsx";

export const router = createBrowserRouter([
	{ path: "/", element: <App /> },
	{ path: "/signup", element: <Signup /> },
	{ path: "/login", element: <Signin /> },
	{ path: "/landing", element: <LandingPage /> },

	{
		path: "/edit-profile",
		element: (
			<PrivateRoute>
				<EditPage />
			</PrivateRoute>
		),
	},

	{
		path: "/dashboard",
		element: (
			<PrivateRoute>
				<Dashboard />
			</PrivateRoute>
		),
	},
	{
		path: "/mentors",
		element: (
			<PrivateRoute>
				<MentorPage />
			</PrivateRoute>
		),
	},
	{
		path: "/members",
		element: (
			<PrivateRoute>
				<MemberPage />
			</PrivateRoute>
		),
	},
	{
		path: "/member/:id",
		element: (
			<PrivateRoute>
				<MemberCardPage />
			</PrivateRoute>
		),
	},
	{
		path: "/profile",
		element: (
			<PrivateRoute>
				<ProfilePage />
			</PrivateRoute>
		),
	},
	{
		path: "/events",
		element: (
			<PrivateRoute>
				<EventsPage />
			</PrivateRoute>
		),
	},
	{
		path: "/events/visualization",
		element: (
			<PrivateRoute>
				<EventsVisualization />
			</PrivateRoute>
		),
	},
	{
		path: "/leaderboard",
		element: (
			<PrivateRoute>
				<LeaderboardPage />
			</PrivateRoute>
		),
	},
]);
