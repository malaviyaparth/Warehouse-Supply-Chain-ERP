import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { isAuthorizedForRole } from "../utils/roles";

const RoleRoute = ({ allowedRoles = [], requiredPermission = null }) => {
    const { user } = useSelector((state) => state.auth);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check role authorization with case-insensitive normalization
    if (!isAuthorizedForRole(user.role, allowedRoles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Validate Optional Granular Permission
    if (requiredPermission && !user.permissions?.some((p) => p.toLowerCase() === requiredPermission.toLowerCase())) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default RoleRoute;

