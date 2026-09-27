import React, { createContext, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loginUser, logoutUser, clearAuth } from "../store/authSlice";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const login = async (credentials) => {
    const resultAction = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || "Login failed");
    }
  };

  const logout = async () => {
    await dispatch(logoutUser());
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    clearAuth: () => dispatch(clearAuth()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};