import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext.jsx";

//TODO: fix private routing and add loading state
const PrivateRoute = ({ children }) => {
	const { session } = UserAuth();

	if (session === undefined) {
		return <div>Loading...</div>;
	}

	return session ? children : <Navigate to="/signup" />;
};

export default PrivateRoute;
