import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { UserAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient.jsx";
import { socialLinks } from "./constants/socialLinks.js";

export default function Login() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const { signInUser } = UserAuth();
	const navigate = useNavigate();

	const handleInputChange = useCallback((e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	}, []);

	const handleLogin = useCallback(
		async (e) => {
			e.preventDefault();
			setLoading(true);
			setError(null);

			try {
				const result = await signInUser({
					email: formData.email,
					password: formData.password,
				});

				if (!result.success) {
					setError("Invalid email or password.");
				} else {
					navigate("/dashboard");
				}
			} catch (error) {
				console.error("Login error:", error);
				setError("Something went wrong. Please try again.");
			} finally {
				setLoading(false);
			}
		},
		[formData.email, formData.password, signInUser, navigate]
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 flex items-center justify-center px-4">
			<div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-lg">
				<div className="text-center mb-6">
					<img src="/MICS_Colorstack_Logo.png" alt="MICS by ColorStack" className="mx-auto mb-4 h-16 w-auto" />
					<h2 className="text-3xl font-black text-gray-900 mb-2">Log In</h2>
					<p className="text-gray-600 mb-6">
						Don't have an account?{" "}
						<Link to="/signup" className="text-indigo-600 hover:underline">
							Sign up!
						</Link>
					</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-5">
					<input type="email" name="email" placeholder="Email" className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.email} onChange={handleInputChange} required />
					<input type="password" name="password" placeholder="Password" className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.password} onChange={handleInputChange} required />
					{error && <p className="text-red-500 text-sm">{error}</p>}

					<button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow">
						{loading ? "Logging in..." : "Log in →"}
					</button>
				</form>

				<div className="mt-6 flex justify-center space-x-6 text-gray-600">
					{socialLinks.map(({ href, icon: Icon, label }) => (
						<a key={label} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600" aria-label={label}>
							<Icon size={24} />
						</a>
					))}
				</div>
			</div>
		</div>
	);
}
