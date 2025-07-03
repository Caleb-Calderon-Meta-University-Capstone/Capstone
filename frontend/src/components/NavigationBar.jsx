import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "./ui/Navigation-menu-base";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { UserAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient";

const navLinks = [
	{ title: "Home", to: "/dashboard" },
	{ title: "Members", to: "/members" },
	{ title: "Events", to: "/events" },
	{ title: "Leaderboard", to: "/leaderboard" },
	{ title: "Profile", to: "/profile" },
];

export default function NavigationBar() {
	const location = useLocation();
	const navigate = useNavigate();
	const { session, signOut } = UserAuth();
	const userId = session?.user?.id;

	const [profilePicture, setProfilePicture] = useState("https://picsum.photos/200/300");
	const [email, setEmail] = useState("noemail@noemail.com");
	const [isHovered, setIsHovered] = useState(false);
	const timeoutRef = useRef(null);

	useEffect(() => {
		const fetchUserProfile = async () => {
			if (!userId) return;
			const { data, error } = await supabase.from("users").select("profile_picture").eq("id", userId).single();

			if (data?.profile_picture) setProfilePicture(data.profile_picture);
			if (session?.user?.email) setEmail(session.user.email);
		};

		fetchUserProfile();
	}, [session, userId]);

	const handleMouseEnter = () => {
		clearTimeout(timeoutRef.current);
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = setTimeout(() => {
			setIsHovered(false);
		}, 100);
	};

	const handleLogout = async () => {
		await signOut();
		navigate("/login");
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

				<NavigationMenuItem className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
					<div className="p-0 border-none bg-transparent cursor-pointer">
						<Avatar className="w-8 h-8">
							<AvatarImage src={profilePicture} alt="Profile" />
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
								<button onClick={handleLogout} className="text-sm px-2 py-1 text-left rounded-md hover:bg-gray-100 transition-colors">
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
