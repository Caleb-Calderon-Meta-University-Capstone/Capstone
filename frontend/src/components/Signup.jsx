import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { UserAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient.jsx";
import { Instagram, Linkedin, Globe2, Eye, EyeOff } from "lucide-react";

const useSignupForm = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const updateField = useCallback((field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setError(null);
	}, []);

	const validateForm = useCallback(() => {
		const { name, email, password, confirmPassword } = formData;

		if (!name || !email || !password || !confirmPassword) {
			return "Please fill all fields.";
		}

		if (name.trim().length < 2) {
			return "Name must be at least 2 characters long.";
		}

		if (!email.includes("@")) {
			return "Please enter a valid email address.";
		}

		if (password.length < 6) {
			return "Password must be at least 6 characters.";
		}

		if (password !== confirmPassword) {
			return "Passwords do not match.";
		}

		return null;
	}, [formData]);

	return {
		formData,
		loading,
		error,
		showPassword,
		showConfirmPassword,
		setLoading,
		setError,
		setShowPassword,
		setShowConfirmPassword,
		updateField,
		validateForm,
	};
};

const FormInput = ({ type, placeholder, value, onChange, icon: Icon, onIconClick, error }) => (
	<div className="relative">
		<input type={type} placeholder={placeholder} value={value} onChange={onChange} className={`w-full bg-gray-100 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${error ? "ring-2 ring-red-500" : ""}`} />
		{Icon && (
			<button type="button" onClick={onIconClick} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
				<Icon size={20} />
			</button>
		)}
	</div>
);

const PasswordInput = ({ placeholder, value, onChange, showPassword, onTogglePassword, error }) => <FormInput type={showPassword ? "text" : "password"} placeholder={placeholder} value={value} onChange={onChange} icon={showPassword ? EyeOff : Eye} onIconClick={onTogglePassword} error={error} />;

const ErrorMessage = ({ message }) => {
	if (!message) return null;

	return (
		<div className="bg-red-50 border border-red-200 rounded-lg p-3">
			<p className="text-red-600 text-sm font-medium">{message}</p>
		</div>
	);
};

const SocialLinks = () => (
	<div className="mt-6 flex justify-center space-x-6 text-gray-600">
		<a href="https://www.instagram.com/micspsu/?hl=en" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100" aria-label="Follow us on Instagram">
			<Instagram size={24} />
		</a>
		<a href="https://www.linkedin.com/company/penn-state-mics/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100" aria-label="Connect with us on LinkedIn">
			<Linkedin size={24} />
		</a>
		<a href="https://colorstack-by-micspsu.framer.website/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100" aria-label="Visit our website">
			<Globe2 size={24} />
		</a>
	</div>
);

const SignupForm = ({ formData, loading, error, showPassword, showConfirmPassword, onUpdateField, onTogglePassword, onToggleConfirmPassword, onSubmit }) => (
	<form onSubmit={onSubmit} className="space-y-5">
		<FormInput type="text" placeholder="Full Name" value={formData.name} onChange={(e) => onUpdateField("name", e.target.value)} error={error} />

		<FormInput type="email" placeholder="Email Address" value={formData.email} onChange={(e) => onUpdateField("email", e.target.value)} error={error} />

		<PasswordInput placeholder="Password" value={formData.password} onChange={(e) => onUpdateField("password", e.target.value)} showPassword={showPassword} onTogglePassword={onTogglePassword} error={error} />

		<PasswordInput placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => onUpdateField("confirmPassword", e.target.value)} showPassword={showConfirmPassword} onTogglePassword={onToggleConfirmPassword} error={error} />

		<ErrorMessage message={error} />

		<button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none">
			{loading ? (
				<div className="flex items-center justify-center">
					<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
					Signing up...
				</div>
			) : (
				"Sign Up →"
			)}
		</button>
	</form>
);

const SignupHeader = () => (
	<div className="text-center mb-6">
		<img src="/MICS_Colorstack_Logo.png" alt="MICS by ColorStack" className="mx-auto mb-4 h-16 w-auto" />
		<h2 className="text-3xl font-black text-gray-900 mb-2">Sign Up</h2>
		<p className="text-gray-600 mb-6">Join our community and start your journey</p>
	</div>
);

const LoginLink = () => (
	<div className="mt-8 text-center text-gray-600 text-sm">
		Already have an account?{" "}
		<Link to="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition-colors">
			Log in
		</Link>
	</div>
);

export default function Signup() {
	const { signUpNewUser } = UserAuth();
	const navigate = useNavigate();

	const { formData, loading, error, showPassword, showConfirmPassword, setLoading, setError, setShowPassword, setShowConfirmPassword, updateField, validateForm } = useSignupForm();

	const handleSignUp = useCallback(
		async (e) => {
			e.preventDefault();

			const validationError = validateForm();
			if (validationError) {
				setError(validationError);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const result = await signUpNewUser(formData.email, formData.password);

				if (!result.success || !result.data?.user) {
					throw new Error("An error occurred during sign up.");
				}

				const user = result.data.user;
				const { error: insertError } = await supabase.from("users").insert([
					{
						id: user.id,
						email: formData.email,
						name: formData.name.trim(),
						points: 0,
						role: "Member",
					},
				]);

				if (insertError) {
					throw new Error("Could not save user info.");
				}

				navigate("/dashboard");
			} catch (err) {
				setError(err.message || "Something went wrong. Please try again.");
			} finally {
				setLoading(false);
			}
		},
		[formData, signUpNewUser, navigate, validateForm, setLoading, setError]
	);

	const togglePassword = useCallback(() => {
		setShowPassword((prev) => !prev);
	}, [setShowPassword]);

	const toggleConfirmPassword = useCallback(() => {
		setShowConfirmPassword((prev) => !prev);
	}, [setShowConfirmPassword]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
			<div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-lg border border-gray-100">
				<SignupHeader />

				<SignupForm formData={formData} loading={loading} error={error} showPassword={showPassword} showConfirmPassword={showConfirmPassword} onUpdateField={updateField} onTogglePassword={togglePassword} onToggleConfirmPassword={toggleConfirmPassword} onSubmit={handleSignUp} />

				<LoginLink />
				<SocialLinks />
			</div>
		</div>
	);
}
