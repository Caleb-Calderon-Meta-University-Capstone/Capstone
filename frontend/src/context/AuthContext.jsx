import { createContext, useState, useContext, useEffect } from "react";
const AuthContext = createContext();
import { supabase } from "../supabaseClient";

export const AuthContextProvider = ({ children }) => {
	const [session, setSession] = useState(undefined);

	//Sign up
	const signUpNewUser = async () => {
		const { data, error } = await supabase.auth.signUp({
			email: email,
			password: password,
		});
		if (error) {
			setError("there was a problem signing up");
			return { success: false, error };
		}
		return { success: true, data };
	};

	//sign in
	const signInUser = async ({ email, password }) => {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email,
				password: password,
			});
			if (error) {
				setError("there was a problem signing in");
				return { success: false, error };
			}
			return { success: true, data };
		} catch (error) {
			console.error("an error occurred during sign in:", error);
		}
	};

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});
	}, []);

	//Sign out
	const signOut = () => {
		const { error } = supabase.auth.signOut();
		if (error) {
			console.log("Error signing out:", error);
		}
	};

	return <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOut }}>{children}</AuthContext.Provider>;
};

export const UserAuth = () => useContext(AuthContext); // ✅ fixed
