import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient.jsx";
import { Instagram, Linkedin, Globe2 } from "lucide-react";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const { signInUser } = UserAuth();
	const navigate = useNavigate();

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const result = await signInUser({ email, password });
			if (!result.success) {
				setError("Invalid email or password.");
			} else {
				navigate("/dashboard");
			}
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-lg">
				<h2 className="text-3xl font-black text-gray-900 mb-2">Log In</h2>
				<p className="text-gray-600 mb-6">
					Don't have an account?{" "}
					<Link to="/signup" className="text-indigo-600 hover:underline">
						Sign up!
					</Link>
				</p>

				<form onSubmit={handleLogin} className="space-y-5">
					<input type="email" placeholder="Email" className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
					<input type="password" placeholder="Password" className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
					{error && <p className="text-red-500 text-sm">{error}</p>}

					<button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow">
						{loading ? "Logging in..." : "Log in →"}
					</button>
				</form>

				<div className="mt-6 flex justify-center space-x-6 text-gray-600">
					<a href="https://www.instagram.com/micspsu/?hl=en" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
						<Instagram size={24} />
					</a>
					<a href="https://www.linkedin.com/company/penn-state-mics/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
						<Linkedin size={24} />
					</a>
					<a href="https://colorstack-by-micspsu.framer.website/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
						<Globe2 size={24} />
					</a>
				</div>
			</div>
		</div>
	);
}
