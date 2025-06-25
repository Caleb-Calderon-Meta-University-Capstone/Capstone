import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext.jsx";

const Signup = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const { signUpNewUser } = UserAuth();
	const navigate = useNavigate();

	const handleSignUp = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const result = await signUpNewUser(email, password);
			if (!result.success) {
				setError("An error occurred during sign up.");
			} else {
				navigate("/dashboard");
			}
		} catch (err) {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<form onSubmit={handleSignUp} className="max-w-md m-auto pt-24">
				<h2 className="text-2xl font-bold mb-6">Sign Up Today!</h2>
				<p>
					Already have an account? <Link to="/login">Log in!</Link>
				</p>
				<div className="flex flex-col py-4">
					<input placeholder="Email" className="bg-blue-100 mt-2 border-2 border-black py-1.5 px-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
					<input placeholder="Password" className="bg-blue-100 mt-2 border-2 border-black py-1.5 px-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					{error && <p className="text-red-500 mt-2">{error}</p>}
					<button disabled={loading} className="bg-blue-500 mt-2 border-2 border-black py-1.5">
						{loading ? "Signing up..." : "Sign up"}
					</button>
				</div>
			</form>
		</div>
	);
};

export default Signup;
