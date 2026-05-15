import { useCallback, useEffect, useState } from "react";
import API from "../api/api";
import { AuthContext } from "./auth-context";

const readStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(readStoredUser);
  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem("user");
      return;
    }

    // Always fetch fresh user data on mount/refresh to stay in sync with DB
    API.get("/auth/me")
      .then((response) => {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const setCurrentUser = useCallback((nextUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = async (email, password) => {
    const response = await API.post("/auth/login", { email, password });
    persistSession(response.data.token, response.data.user);
    return response.data.user;
  };

  const signup = async (name, email, password, role) => {
    const response = await API.post("/auth/signup", { name, email, password, role });
    persistSession(response.data.token, response.data.user);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const getHomeRouteForRole = (role = user?.role) => {
    if (role === "teacher") {
      return "/teacher/dashboard";
    }

    if (role === "admin") {
      return "/admin";
    }

    return "/dashboard";
  };

  const value = {
    token,
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    setCurrentUser,
    getHomeRouteForRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
