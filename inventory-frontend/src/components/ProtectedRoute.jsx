import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    const isUnsafeFrom = ["/login", "/register", "/unauthorized"].includes(location.pathname);
    return <Navigate to="/login" state={isUnsafeFrom ? {} : { from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
