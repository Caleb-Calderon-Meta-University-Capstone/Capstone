import React from "react";
import NavigationBar from "./NavigationBar";

export default function ProfilePage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900">
			<NavigationBar />
			<div className="max-w-6xl mx-auto p-6">
				<h1 className="text-4xl font-bold mb-8">My Profile</h1>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-white p-6 rounded-xl shadow flex flex-col items-center text-center">
						<div className="w-24 h-24 rounded-full bg-gray-300 mb-4"></div>
						<h2 className="text-2xl font-semibold">Jasmine Chen</h2>
						<p className="text-gray-600">Freshman</p>
						<span className="mt-2 px-3 py-1 text-sm font-medium border border-blue-500 text-blue-500 rounded-full">150 points</span>
					</div>

					<div className="md:col-span-2 flex flex-col gap-4">
						<div className="bg-white p-6 rounded-xl shadow">
							<h3 className="text-xl font-bold mb-2">About Me</h3>
							<p className="text-gray-700">First-year CS student passionate about web development and AI. Looking for mentorship opportunities!</p>
						</div>

						<div className="bg-white p-6 rounded-xl shadow">
							<h3 className="text-xl font-bold mb-2">Skills</h3>
							<div className="flex flex-wrap gap-2">
								<span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">JavaScript</span>
								<span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">Python</span>
								<span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">React</span>
							</div>
						</div>

						<div className="bg-white p-6 rounded-xl shadow">
							<h3 className="text-xl font-bold mb-2">Interests</h3>
							<div className="flex flex-wrap gap-2">
								<span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">Web Development</span>
								<span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">AI/ML</span>
								<span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">Mobile Apps</span>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
							<div className="bg-blue-100 p-6 rounded-xl text-center shadow">
								<p className="text-2xl font-bold text-blue-700">150</p>
								<p className="text-sm text-gray-600">Total Points</p>
							</div>
							<div className="bg-blue-100 p-6 rounded-xl text-center shadow">
								<p className="text-2xl font-bold text-blue-700">5</p>
								<p className="text-sm text-gray-600">Events Attended</p>
							</div>
							<div className="bg-blue-100 p-6 rounded-xl text-center shadow">
								<p className="text-2xl font-bold text-blue-700">12</p>
								<p className="text-sm text-gray-600">Connections</p>
							</div>
						</div>

						<div className="flex justify-end mt-6">
							<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold">Edit Profile</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
