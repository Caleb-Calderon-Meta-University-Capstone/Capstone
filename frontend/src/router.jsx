import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Signup from "./components/Signup.jsx";
import Signin from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import App from "./App.jsx";

export const router = createBrowserRouter([
	{ path: "/", element: <App /> },
	{ path: "/signup", element: <Signup /> },
	{ path: "/login", element: <Signin /> },
	{ path: "/dashboard", element: <Dashboard /> },
]);
