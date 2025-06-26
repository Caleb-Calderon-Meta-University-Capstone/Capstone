import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
	const [session, setSession] = useState(undefined);

	// Sign up
	const signUpNewUser = async (email, password) => {
		const { data, error } = await supabase.auth.signUp({ email, password });
		if (error) {
			return { success: false, error };
		}
		return { success: true, data };
	};

	// Sign in
	const signInUser = async ({ email, password }) => {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) {
				return { success: false, error };
			}
			return { success: true, data };
		} catch (error) {
			console.error("An error occurred during sign in:", error);
			return { success: false, error };
		}
	};

	// Sign out
	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Error signing out:", error);
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

	return <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOut }}>{children}</AuthContext.Provider>;
};

export const UserAuth = () => useContext(AuthContext);
