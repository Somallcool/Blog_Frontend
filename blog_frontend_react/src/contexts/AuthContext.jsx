// src/contexts/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      const userNickname = sessionStorage.getItem("userNickname");
      const jwtToken = sessionStorage.getItem("jwtToken");

      if (isLoggedIn && userNickname && jwtToken) {
        setUser({ nickname: userNickname, token: jwtToken });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData, token) => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("userNickname", userData.nickname);
    sessionStorage.setItem("jwtToken", token);
    setUser({ ...userData, token });
  };

  const logout = () => {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userNickname");
    sessionStorage.removeItem("jwtToken");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userNickname");
    setUser(null);
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
