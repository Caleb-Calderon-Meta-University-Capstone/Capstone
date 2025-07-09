import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext.jsx";
import { Button } from "./ui/button";
import { supabase } from "../supabaseClient.jsx";

const Signup = () => {
	const [name, setName] = useState("");
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
	
		if (!email || !password || !name || password.length < 6) {
			setError("Please fill all fields. Password must be at least 6 characters.");
			setLoading(false);
			return;
		}
	
		try {
			const result = await signUpNewUser(email, password);
			console.log("SIGNUP RESULT:", result);
	
			if (!result.success || !result.data?.user) {
				setError("An error occurred during sign up.");
			} else {
				const user = result.data.user;
	
				const { error: insertError } = await supabase.from("users").insert([
					{
						id: user.id,
						email,
						name,
						points: 0,
						role: "Member",
					},
				]);
	
				if (insertError) {
					console.error("Supabase Insert Error:", insertError.message);
					setError("Could not save user info.");
					return;
				}
	
				navigate("/dashboard");
			}
		} catch (err) {
			console.error(err);
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
					Already have an account?{" "}
					<Link className="text-blue-600 hover:underline" to="/login">
						Log in!
					</Link>
				</p>
				<div className="flex flex-col py-4">
					<input placeholder="Name" className="bg-blue-100 mt-2 border-2 border-black py-1.5 px-2" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
					<input placeholder="Email" className="bg-blue-100 mt-2 border-2 border-black py-1.5 px-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
					<input placeholder="Password" className="bg-blue-100 mt-2 border-2 border-black py-1.5 px-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					{error && <p className="text-red-500 mt-2">{error}</p>}
					<Button disabled={loading} className="mt-2">
						{loading ? "Signing in..." : "Sign up"}
					</Button>
				</div>
			</form>
		</div>
	);
};

export default Signup;
