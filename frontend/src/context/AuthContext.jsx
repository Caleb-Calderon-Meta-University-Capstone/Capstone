import { createContext, userState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(undefined);

    return (
        <AuthContext.Provider value={{ session }}>
            {children}
        </AuthContext.Provider>
    );
};  

export const useAuth = () => useContext(AuthContext);