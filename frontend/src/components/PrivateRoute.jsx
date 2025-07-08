import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

const PrivateRoute = ({ children }) => {
	const { session } = UserAuth();

	if (session === undefined) {
		return <LoadingSpinner />;
	}

	return session ? children : <Navigate to="/signup" />;
};

export default PrivateRoute;
