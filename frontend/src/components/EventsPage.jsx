import React, { useEffect, useState } from "react";
import NavigationBar from "./NavigationBar";
import Events from "./Events";
import { supabase } from "../supabaseClient";
import Footer from "./Footer";
import { HelpCircle } from "lucide-react";

export default function EventsPage() {
	const [role, setRole] = useState(null);
	const [activeTab, setActiveTab] = useState("all");

	useEffect(() => {
		(async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();

			setRole(userData?.role ?? "Member");
		})();
	}, []);

	return (
		<div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white min-h-screen">
			<NavigationBar active="events" />
			<div className="py-12 px-4">
				<div className="w-fit mx-auto text-center">
					<div className="flex items-center justify-center mb-4">
						<img src="/MICS_Colorstack_Logo_Light.png" alt="MICS by ColorStack" className="h-16 w-auto mr-4" />
						<div className="flex items-center space-x-2">
							<h1 className="text-5xl font-black text-center text-white tracking-tight relative z-10">{activeTab === "recommended" ? "MICS Recommended Events" : "MICS Events Schedule"}</h1>
							{activeTab === "recommended" && (
								<div className="relative inline-block">
									<HelpCircle className="peer w-6 h-6 text-white hover:text-gray-200 cursor-pointer" />
									<div className="pointer-events-none opacity-0 peer-hover:opacity-100 transition-opacity duration-200 absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-900 text-sm rounded-lg shadow-lg p-4 z-50">
										<div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/95 border-l border-t border-gray-200 rotate-45" />
										<h3 className="font-semibold text-gray-900 mb-2">How recommendations work</h3>
										<ul className="list-decimal list-inside space-y-2">
											<li>
												<span className="font-semibold text-indigo-600">Learn</span> from your feedback on events you liked or disliked.
											</li>
											<li>
												<span className="font-semibold text-indigo-600">Analyze</span> event features like location type, duration, attendance, and feedback reasons.
											</li>
											<li>
												<span className="font-semibold text-indigo-600">Cluster</span> similar events using K-means algorithm to group events with shared characteristics.
											</li>
											<li>
												<span className="font-semibold text-indigo-600">Score</span> unseen events based on similarity to your preferences and recommend the best matches.
											</li>
										</ul>
									</div>
								</div>
							)}
						</div>
					</div>
					{activeTab === "recommended" ? <p className="text-center text-white mt-3 mb-10 text-lg font-semibold relative z-10">Recommended events using K-means algorithm based on your feedback</p> : <p className="text-center text-white mt-3 mb-10 text-lg font-semibold relative z-10">Stay connected with upcoming events, workshops, and networking opportunities</p>}
				</div>

				<div>
					<Events role={role} onTabChange={setActiveTab} />
				</div>
			</div>
			<Footer />
		</div>
	);
}
