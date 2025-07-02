import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "./ui/Navigation-menu-base";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

const navLinks = [
	{ title: "Home", to: "/dashboard" },
	{ title: "Members", to: "/members" },
	{ title: "Events", to: "/events" },
	{ title: "Leaderboard", to: "/leaderboard" },
];

export default function NavigationBar() {
	const location = useLocation();
	const navigate = useNavigate();
	const email = "fakemailfornow@meta.com";
	const [isHovered, setIsHovered] = useState(false);
	const timeoutRef = useRef(null);

	const handleMouseEnter = () => {
		clearTimeout(timeoutRef.current);
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = setTimeout(() => {
			setIsHovered(false);
		}, 100); 
	};

	return (
		<NavigationMenu className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm w-full h-full">
			<NavigationMenuList className="flex justify-center space-x-8 items-center">
				{navLinks.map(({ title, to }) => (
					<NavigationMenuItem key={to}>
						<NavigationMenuLink asChild>
							<Link to={to} className={`text-sm font-medium transition-colors ${location.pathname === to ? "text-blue-600 underline underline-offset-4" : "text-gray-700 hover:text-blue-500"}`}>
								{title}
							</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
				))}

				{/* Avatar + Dropdown Container */}
				<NavigationMenuItem className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
					<div className="p-0 border-none bg-transparent cursor-pointer">
						<Avatar className="w-8 h-8">
							<AvatarImage src="https://picsum.photos/200/300" alt="Profile" />
							<AvatarFallback>N/A</AvatarFallback>
						</Avatar>
					</div>

					{isHovered && (
						<div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[180px] z-50">
							<p className="text-xs text-gray-500 mb-2 px-1">{email}</p>
							<div className="flex flex-col space-y-1">
								<Link to="/profile" className="text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors">
									Profile
								</Link>
								<button onClick={() => navigate("/login")} className="text-sm px-2 py-1 text-left rounded-md hover:bg-gray-100 transition-colors">
									Log Out
								</button>
							</div>
						</div>
					)}
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
