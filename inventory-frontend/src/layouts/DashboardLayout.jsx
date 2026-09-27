import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const DashboardLayout = () => {
    return (
        <div className="erp-layout">
            <Sidebar />
            <div className="erp-main-container">
                <Navbar />
                <main className="erp-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
