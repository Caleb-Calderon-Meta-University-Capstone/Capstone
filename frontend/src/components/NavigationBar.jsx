import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "./ui/Navigation-menu-base";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { UserAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient";

const NAV_LINKS = [
	{ title: "Home", to: "/dashboard" },
	{ title: "Members", to: "/members" },
	{ title: "Events", to: "/events" },
	{ title: "Leaderboard", to: "/leaderboard" },
	{ title: "Mentors", to: "/mentors" },
];

const useUserProfile = (userId, session) => {
	const [profilePicture, setProfilePicture] = useState("/default-avatar.svg");
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const fetchUserProfile = useCallback(async () => {
		if (!userId) return;

		try {
			setLoading(true);
			setError(null);

			const { data, error: supabaseError } = await supabase.from("users").select("profile_picture").eq("id", userId).single();

			if (supabaseError) throw supabaseError;

			if (data?.profile_picture) {
				setProfilePicture(data.profile_picture);
			}

			if (session?.user?.email) {
				setEmail(session.user.email);
			}
		} catch (err) {
			setError(err.message);
			console.error("Error fetching user profile:", err);
		} finally {
			setLoading(false);
		}
	}, [userId, session]);

	useEffect(() => {
		fetchUserProfile();
	}, [fetchUserProfile]);

	return {
		profilePicture,
		email,
		loading,
		error,
		refetch: fetchUserProfile,
	};
};

const Logo = () => (
	<Link to="/dashboard" className="flex items-center">
		<img src="/MICS_Colorstack_Logo.png" alt="MICS by ColorStack" className="h-10 w-auto transition-transform duration-200 hover:scale-105" />
	</Link>
);

const NavLink = ({ title, to, isActive }) => (
	<NavigationMenuItem>
		<NavigationMenuLink asChild>
			<Link to={to} className={`text-sm font-medium transition-colors duration-200 ${isActive ? "text-blue-600 underline underline-offset-4" : "text-gray-700 hover:text-blue-500"}`}>
				{title}
			</Link>
		</NavigationMenuLink>
	</NavigationMenuItem>
);

const NavigationLinks = ({ currentPath }) => (
	<div className="flex items-center space-x-8">
		{NAV_LINKS.map(({ title, to }) => (
			<NavLink key={to} title={title} to={to} isActive={currentPath === to} />
		))}
	</div>
);

const ProfileDropdown = ({ email, onProfileClick, onLogoutClick }) => (
	<div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[160px] z-50 opacity-100 scale-100 transition-all duration-200 ease-out">
		<p className="text-xs text-gray-500 mb-2 px-1 truncate">{email}</p>
		<div className="flex flex-col space-y-1">
			<button onClick={onProfileClick} className="text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-left w-full">
				Profile
			</button>
			<button onClick={onLogoutClick} className="text-sm px-2 py-1 text-left rounded-md hover:bg-gray-100 transition-colors w-full">
				Log Out
			</button>
		</div>
	</div>
);

const ProfileAvatar = ({ profilePicture, email, onProfileClick, onLogoutClick }) => {
	const [isHovered, setIsHovered] = useState(false);
	const timeoutRef = useRef(null);

	const handleMouseEnter = useCallback(() => {
		clearTimeout(timeoutRef.current);
		setIsHovered(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		timeoutRef.current = setTimeout(() => {
			setIsHovered(false);
		}, 100);
	}, []);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return (
		<NavigationMenuItem className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			<div className="p-0 border border-blue-200 rounded-full bg-transparent cursor-pointer hover:ring-2 hover:ring-blue-300 transition-transform duration-200">
				<Avatar className="w-[3em] h-[3em] transition-transform duration-300 hover:scale-105">
					<AvatarImage
						src={profilePicture}
						alt="Profile"
						onError={(e) => {
							e.target.src = "/default-avatar.svg";
						}}
					/>
					<AvatarFallback>N/A</AvatarFallback>
				</Avatar>
			</div>

			{isHovered && <ProfileDropdown email={email} onProfileClick={onProfileClick} onLogoutClick={onLogoutClick} />}
		</NavigationMenuItem>
	);
};

export default function NavigationBar() {
	const location = useLocation();
	const navigate = useNavigate();
	const { session, signOut } = UserAuth();
	const userId = session?.user?.id;

	const { profilePicture, email } = useUserProfile(userId, session);

	const handleProfileClick = useCallback(() => {
		navigate("/profile");
	}, [navigate]);

	const handleLogout = useCallback(async () => {
		try {
			await signOut();
			navigate("/landing");
		} catch (error) {
			console.error("Error during logout:", error);
		}
	}, [signOut, navigate]);

	return (
		<NavigationMenu className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm w-full h-full">
			<NavigationMenuList className="flex justify-between items-center">
				<div className="flex items-center space-x-8">
					<Logo />
					<NavigationLinks currentPath={location.pathname} />
				</div>

				<ProfileAvatar profilePicture={profilePicture} email={email} onProfileClick={handleProfileClick} onLogoutClick={handleLogout} />
			</NavigationMenuList>
		</NavigationMenu>
	);
}
