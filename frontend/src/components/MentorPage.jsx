import React from "react";
import NavigationBar from "./NavigationBar";

export default function MentorPage() {
	const mentors = [
		{
			id: 1,
			name: "Ava Johnson",
			year: "Senior",
			bio: "Passionate about frontend development and helping others grow.",
			profile_picture: "https://picsum.photos/200?random=1",
			points: 420,
			skills: { JavaScript: "Advanced", React: "Intermediate", CSS: "Advanced" },
			interests: ["Web Dev", "UI/UX", "Teaching"],
			experience_years: 3,
		},
		{
			id: 2,
			name: "Liam Chen",
			year: "Graduate",
			bio: "ML enthusiast who loves mentoring early CS students.",
			profile_picture: "https://picsum.photos/200?random=2",
			points: 510,
			skills: { Python: "Advanced", "Machine Learning": "Intermediate", SQL: "Intermediate" },
			interests: ["AI", "Data Science", "Community"],
			experience_years: 4,
		},
		{
			id: 3,
			name: "Sofia Patel",
			year: "Junior",
			bio: "Loves working on open-source projects and empowering others.",
			profile_picture: "https://picsum.photos/200?random=3",
			points: 380,
			skills: { Java: "Intermediate", Git: "Advanced", "Project Management": "Beginner" },
			interests: ["Open Source", "Startups", "Leadership"],
			experience_years: 2,
		},
	];

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<NavigationBar />
			<h1 className="text-3xl font-bold text-center my-6">AI Mentor Matching</h1>
			<p className="text-center mb-10 text-gray-600">Browse featured mentors matched by interest & skills</p>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 m-10">
				{mentors.map((mentor, index) => {
					const matchScore = [91, 83, 76][index % 3];
					const profilePicture = mentor.profile_picture;

					return (
						<div key={mentor.id} className="relative bg-white shadow-lg rounded-xl p-6 flex flex-col items-center text-center border border-blue-200">

							<div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-blue-200 mb-4">
								<img src={profilePicture} alt={mentor.name} className="object-cover w-full h-full" />
							</div>


							<div className="text-lg font-bold flex items-center gap-2">
								{mentor.name}
								<span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Mentor</span>
							</div>

							<div className="text-sm text-gray-600 mb-2">{mentor.year} • {mentor.experience_years} yrs experience</div>

							<p className="text-sm text-gray-700 mb-3">{mentor.bio}</p>
							<div className="w-full mb-3">
								<div className="font-semibold text-sm mb-1">Skills</div>
								<div className="flex flex-wrap gap-2 justify-center">
									{Object.entries(mentor.skills).map(([skill, level]) => (
										<span
											key={skill}
											className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
										>
											{skill} ({level})
										</span>
									))}
								</div>
							</div>

							<div className="w-full mb-3">
								<div className="font-semibold text-sm mb-1">Interests</div>
								<div className="flex flex-wrap gap-2 justify-center">
									{mentor.interests.map((interest, i) => (
										<span
											key={i}
											className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
										>
											{interest}
										</span>
									))}
								</div>
							</div>

							<div className="w-full mb-2">
								<div className="text-sm text-gray-600 font-medium mb-1">Match Score</div>
								<div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
									<div
										className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
										style={{ width: `${matchScore}%` }}
									></div>
								</div>
								<div className="text-sm mt-1 text-blue-700 font-semibold">{matchScore}% match</div>
							</div>

							<div className="text-sm text-gray-600 mb-2">{mentor.points} total points</div>

							<button className="mt-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm shadow-sm">
								Connect
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
