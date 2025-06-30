import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

const links = [
	{ name: "Dashboard", path: "/dashboard" },
	{ name: "Events", path: "/events" },
	{ name: "Leaderboard", path: "/leaderboard" },
	{ name: "Members", path: "/members" },
	{ name: "User Menu", path: "/profile" },
];

const NavigationBar = () => {
	const location = useLocation();

	return (
		<nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
			<ul className="flex justify-center space-x-4">
				{links.map((link) => (
					<li key={link.path}>
						<Link to={link.path}>
							<Button variant={location.pathname === link.path ? "default" : "ghost"} className={location.pathname === link.path ? "underline underline-offset-4" : ""}>
								{link.name}
							</Button>
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
};

export default NavigationBar;
