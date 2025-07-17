import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient.jsx";
import { Instagram, Linkedin, Globe2 } from "lucide-react";

export default function Signup() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const { signUpNewUser } = UserAuth();
	const navigate = useNavigate();

	const handleSignUp = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		if (!name || !email || !password || !confirmPassword) {
			setError("Please fill all fields.");
			setLoading(false);
			return;
		}
		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			setLoading(false);
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			setLoading(false);
			return;
		}

		try {
			const result = await signUpNewUser(email, password);
			if (!result.success || !result.data?.user) {
				setError("An error occurred during sign up.");
			} else {
				const user = result.data.user;
				const { error: insertError } = await supabase.from("users").insert([{ id: user.id, email, name, points: 0, role: "Member" }]);
				if (insertError) {
					setError("Could not save user info.");
				} else {
					navigate("/dashboard");
				}
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
				<h2 className="text-3xl font-black text-gray-900 mb-2">Sign Up</h2>
				<p className="text-gray-600 mb-6">Please fill your information below</p>

				<form onSubmit={handleSignUp} className="space-y-5">
					<input type="text" placeholder="Name" className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={(e) => setName(e.target.value)} />
					<input type="email" placeholder="Email" className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} />
					<input type="password" placeholder="Password" className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} />
					<input type="password" placeholder="Confirm Password" className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
					{error && <p className="text-red-500 text-sm">{error}</p>}

					<button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow">
						{loading ? "Signing up..." : "Next →"}
					</button>
				</form>

				<div className="mt-8 text-center text-gray-600 text-sm">
					Already have an account?{" "}
					<Link to="/login" className="text-indigo-600 hover:underline">
						Log in
					</Link>
				</div>

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
