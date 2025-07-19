import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext.jsx";
import { SOCIAL_LINKS } from "./constants/socialLinks";

export default function Footer() {
	const { session } = UserAuth();
	const loggedIn = useMemo(() => !!session, [session]);

	const renderSocialLink = ({ href, icon: Icon, label }) => (
		<a key={href} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600" aria-label={label}>
			<Icon size={22} />
		</a>
	);

	return (
		<footer className="w-full bg-white border-t">
			<div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<img src="/MICS_Colorstack_Logo.png" alt="MICS by ColorStack" className="h-8 w-auto" />
					<p className="text-sm text-gray-600 text-center sm:text-left">© 2025 by Caleb Calderon</p>
				</div>

				{!loggedIn && (
					<Link to="/signup" className="text-sm font-medium text-indigo-600 hover:underline">
						Create an account ↗
					</Link>
				)}

				<div className="flex gap-6 text-gray-500">{SOCIAL_LINKS.map(renderSocialLink)}</div>
			</div>
		</footer>
	);
}
