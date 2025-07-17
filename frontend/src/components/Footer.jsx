import { Link } from "react-router-dom";
import { Instagram, Linkedin, Globe2 } from "lucide-react";
import { UserAuth } from "../context/AuthContext.jsx";

export default function Footer() {
	const { session } = UserAuth(); 
	const loggedIn = !!session;

	return (
		<footer className="w-full bg-white border-t">
			<div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
				<p className="text-sm text-gray-600 text-center sm:text-left">
					© 2025 <span className="font-semibold">MICS Connect</span> by Caleb Calderon
				</p>

				{!loggedIn && (
					<Link to="/signup" className="text-sm font-medium text-indigo-600 hover:underline">
						Create an account ↗
					</Link>
				)}

				<div className="flex gap-6 text-gray-500">
					<a href="https://www.instagram.com/micspsu/?hl=en" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
						<Instagram size={22} />
					</a>
					<a href="https://www.linkedin.com/company/penn-state-mics/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
						<Linkedin size={22} />
					</a>
					<a href="https://colorstack-by-micspsu.framer.website/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
						<Globe2 size={22} />
					</a>
				</div>
			</div>
		</footer>
	);
}
