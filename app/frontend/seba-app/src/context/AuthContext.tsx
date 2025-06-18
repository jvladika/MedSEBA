import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthState, LoginCredentials } from "../types";
import api from "../api";

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  toggleSidebar: () => void;
  setUser: (user: AuthState["user"]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: undefined,
    sidebarOpen: false,
  });

  // Rehydrate state on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      rehydrateUser(token);
    }
  }, []);

  // Fetch the user using the token
  const rehydrateUser = async (token: string) => {
    try {
      const userResponse = await api.get("/api/user/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState({
        isAuthenticated: true,
        token,
        user: userResponse.data,
        sidebarOpen: false,
      });
    } catch (error) {
      console.error("Error rehydrating user:", error);
      logout();
    }
  };

  const setUser = (user: AuthState["user"]) => {
    setState((prev) => ({ ...prev, user }));
  };

  const toggleSidebar = () => {
    setState((prev) => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch("http://localhost:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) throw new Error("Login failed");

      const userResponse = await api.get("/api/user/", {
        headers: { Authorization: `Bearer ${data.access}` },
      });

      localStorage.setItem("token", data.access);
      setState({
        isAuthenticated: true,
        token: data.access,
        user: userResponse.data,
        sidebarOpen: false,
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setState({ isAuthenticated: false, token: null, user: undefined });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        toggleSidebar,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
