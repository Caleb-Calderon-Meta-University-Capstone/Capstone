import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import Footer from "./Footer";
import LoadingSpinner from "./LoadingSpinner";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

const useUserProfile = (userId) => {
	const [userData, setUserData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchUserData = useCallback(async () => {
		if (!userId) return;

		try {
			setLoading(true);
			setError(null);

			const { data, error: supabaseError } = await supabase.from("users").select("*").eq("id", userId).single();

			if (supabaseError) throw supabaseError;

			setUserData(data);
		} catch (err) {
			setError(err.message);
			console.error("Error fetching user data:", err);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

	return {
		userData,
		loading,
		error,
		refetch: fetchUserData,
	};
};

const ProfileHeader = ({ userData }) => {
	const profilePicture = userData?.profile_picture || "/default-avatar.svg";

	return (
		<div className="bg-white p-6 rounded-xl shadow flex flex-col items-center text-center">
			<div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-blue-200">
				<img
					src={profilePicture}
					alt="Profile"
					className="object-cover w-full h-full"
					onError={(e) => {
						e.target.src = "/default-avatar.svg";
					}}
				/>
			</div>
			<h2 className="text-2xl font-semibold text-gray-900">{userData?.name || "Unknown User"}</h2>
			<p className="text-gray-700 mb-2">{userData?.year || "Student"}</p>
			<span className="px-3 py-1 text-sm font-medium border border-blue-500 text-blue-700 rounded-full bg-blue-50">{userData?.points ?? 0} points</span>
		</div>
	);
};

const AboutSection = ({ bio }) => (
	<section className="bg-white p-6 rounded-xl shadow">
		<h3 className="text-xl font-bold mb-3 text-gray-900">About Me</h3>
		<p className="text-gray-800 leading-relaxed">{bio || "No bio yet. Add a bio to tell others about yourself!"}</p>
	</section>
);

const SkillsSection = ({ skills }) => {
	if (!skills || Object.keys(skills).length === 0) {
		return (
			<section className="bg-white p-6 rounded-xl shadow">
				<h3 className="text-xl font-bold mb-3 text-gray-900">Skills</h3>
				<p className="text-gray-700 text-sm">No skills listed yet.</p>
			</section>
		);
	}

	return (
		<section className="bg-white p-6 rounded-xl shadow">
			<h3 className="text-xl font-bold mb-3 text-gray-900">Skills</h3>
			<div className="flex flex-wrap gap-2">
				{Object.entries(skills).map(([skill, level]) => (
					<span key={skill} className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800 font-medium">
						{skill} ({level})
					</span>
				))}
			</div>
		</section>
	);
};

const InterestsSection = ({ interests }) => {
	if (!interests || interests.length === 0) {
		return (
			<section className="bg-white p-6 rounded-xl shadow">
				<h3 className="text-xl font-bold mb-3 text-gray-900">Interests</h3>
				<p className="text-gray-700 text-sm">No interests listed yet.</p>
			</section>
		);
	}

	return (
		<section className="bg-white p-6 rounded-xl shadow">
			<h3 className="text-xl font-bold mb-3 text-gray-900">Interests</h3>
			<div className="flex flex-wrap gap-2">
				{interests.map((interest, idx) => (
					<span key={idx} className="bg-purple-100 px-3 py-1 rounded-full text-sm text-purple-800 font-medium">
						{interest}
					</span>
				))}
			</div>
		</section>
	);
};

const StatCard = ({ value, label, color = "blue" }) => {
	const colorClasses = {
		blue: "bg-blue-100 text-blue-700",
		green: "bg-green-100 text-green-700",
		purple: "bg-purple-100 text-purple-700",
		orange: "bg-orange-100 text-orange-700",
	};

	return (
		<div className={`${colorClasses[color]} p-6 rounded-xl text-center shadow`}>
			<p className="text-2xl font-bold">{value}</p>
			<p className="text-sm text-gray-700">{label}</p>
		</div>
	);
};

const StatsGrid = ({ userData }) => (
	<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
		<StatCard value={userData?.points ?? 0} label="Total Points" color="blue" />
		<StatCard value={userData?.events_attended ?? 0} label="Events Attended" color="green" />
	</div>
);

const EditProfileButton = ({ onClick }) => (
	<div className="flex justify-center mt-6">
		<button onClick={onClick} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
			Edit Profile
		</button>
	</div>
);

const ErrorState = ({ error, onRetry }) => (
	<div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white">
		<NavigationBar />
		<div className="flex-1 flex items-center justify-center">
			<div className="text-center max-w-md mx-auto px-4">
				<div className="text-red-400 mb-4">
					<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Profile</h2>
				<p className="text-gray-700 mb-6">{error}</p>
				<button onClick={onRetry} className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-200 font-medium">
					Try Again
				</button>
			</div>
		</div>
		<Footer />
	</div>
);

const ProfileContent = ({ userData, onEditProfile }) => (
	<div className="max-w-6xl mx-auto p-6">
		<div className="flex items-center justify-between mb-8">
			<h1 className="text-4xl font-bold text-white">My Profile</h1>
			<div className="text-sm text-white">Member since {new Date(userData?.created_at).toLocaleDateString()}</div>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			<ProfileHeader userData={userData} />

			<div className="md:col-span-2 flex flex-col gap-4">
				<AboutSection bio={userData?.bio} />
				<SkillsSection skills={userData?.skills} />
				<InterestsSection interests={userData?.interests} />
				<StatsGrid userData={userData} />
				<EditProfileButton onClick={onEditProfile} />
			</div>
		</div>
	</div>
);

export default function ProfilePage() {
	const { session } = UserAuth();
	const navigate = useNavigate();
	const userId = session?.user?.id;

	const { userData, loading, error, refetch } = useUserProfile(userId);

	const handleEditProfile = useCallback(() => {
		navigate("/edit-profile");
	}, [navigate]);

	if (loading) return <LoadingSpinner />;

	if (error) {
		return <ErrorState error={error} onRetry={refetch} />;
	}

	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white">
			<NavigationBar />
			<main className="flex-1">
				<ProfileContent userData={userData} onEditProfile={handleEditProfile} />
			</main>
			<Footer />
		</div>
	);
}
