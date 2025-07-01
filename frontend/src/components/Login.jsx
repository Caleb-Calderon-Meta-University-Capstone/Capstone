import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext.jsx";
import { Button } from "./ui/button";


const Login = () => {
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
		} catch (err) {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<form onSubmit={handleLogin} className="max-w-md m-auto pt-24">
				<h2 className="text-2xl font-bold mb-6">Sign In</h2>
				<p>
					Don't have an account? <Link to="/signup">Sign up!</Link>
				</p>
				<div className="flex flex-col py-4">
					<input placeholder="Email" className="bg-blue-100 mt-2 border-2 border-black py-1.5 px-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
					<input placeholder="Password" className="bg-blue-100 mt-2 border-2 border-black py-1.5 px-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					{error && <p className="text-red-500 mt-2">{error}</p>}
					<Button disabled={loading} className="mt-2">
						{loading ? "Logging in..." : "Log in"}
					</Button>
				</div>
			</form>
		</div>
	);
};

export default Login;
