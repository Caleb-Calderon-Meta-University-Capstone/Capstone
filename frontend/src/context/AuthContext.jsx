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

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});
	}, []);

	return <AuthContext.Provider value={{ session, signUpNewUser }}>{children}</AuthContext.Provider>;
};

export const UserAuth = () => useContext(AuthContext); // ✅ fixed
