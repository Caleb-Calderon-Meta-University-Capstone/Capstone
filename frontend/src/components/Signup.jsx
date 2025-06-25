import { Link } from "react-router-dom";
import React, { useState } from "react";

const Signup = () => {
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState(null);

	return (
		<div>
			<form className="max-w-md m-auto pt-24">
				<h2 className="text-2xl font-bold mb-6">Sign Up Today!</h2>
				<p>
					Already have an account? <Link to="/Login"> Log in!</Link>
				</p>
				<div className="flex flex-col py-4">
					<input placeholder="Email" className="bg-blue-100 mt-2 border-2 border-black py-1.5" type="email" name="" id="" />
					<input placeholder="Password" className="bg-blue-100 mt-2 border-2 border-black py-1.5" type="password" name="" id="" />
					<button disabled={loading} className="bg-blue-500 mt-2 border-2 border-black py-1.5">
						{" "}
						Sign up
					</button>
				</div>
			</form>
		</div>
	);
};

export default Signup;
