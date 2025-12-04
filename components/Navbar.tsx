"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { logout } from "@/components/slices/authSlice";

const Header: React.FC = () => {
    const [show, setShow] = useState<boolean>(false);

    // --- Redux Auth State (REAL data saved by redux-persist)
    const authState = useSelector((state: any) => state.auth);
    console.log(authState)
    const dispatch = useDispatch();

    const router = useRouter();

    const navigateTo = (path: string) => {
        setShow(false);
        setTimeout(() => router.push(path), 200);
    };

    const handleLogout = () => {
        dispatch(logout()); // clear redux state
        localStorage.removeItem("fyp_token"); // remove token
        navigateTo("/login");
    };

    const userRole = authState?.user?.role;
    const isAdmin = userRole && ["admin", "superAdmin"].includes(userRole);

    return (
        <div className="font-inter">
            {/* NAVBAR */}
            <nav className="w-full bg-white border-b border-gray-200 shadow-md px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                <div
                    className="text-xl font-bold text-indigo-600 cursor-pointer transition hover:text-indigo-800"
                    onClick={() => navigateTo("/")}
                >
                    Follow Up Portal
                </div>

                <button
                    onClick={() => setShow(true)}
                    className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
            </nav>

            {/* BACKDROP */}
            <div
                className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${show ? "opacity-40 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setShow(false)}
            ></div>

            {/* SIDEBAR */}
            <div
                className={`fixed top-0 left-0 w-64 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ${show ? "translate-x-0" : "-translate-x-full"
                    } flex flex-col`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-indigo-50">
                    <h2 className="text-xl font-bold text-indigo-600">Menu</h2>
                    <button
                        onClick={() => setShow(false)}
                        className="text-gray-500 hover:text-gray-700 p-1 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* NAV LINKS */}
                <nav className="flex flex-col p-4 space-y-2 text-gray-700 grow">
                    <button
                        onClick={() => navigateTo("/")}
                        className="text-left py-2 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                    >
                        Dashboard
                    </button>

                    {authState?.isLoggedIn && (
                        <button
                            onClick={() => navigateTo("/my-list")}
                            className="text-left py-2 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                        >
                            My List
                        </button>
                    )}

                    {!authState?.isLoggedIn && (
                        <button
                            onClick={() => navigateTo("/login")}
                            className="text-left py-2 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                        >
                            Login
                        </button>
                    )}

                    {(isAdmin) && (
                        <button
                            onClick={() => navigateTo("/sign-up")}
                            className="text-left py-2 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                        >
                            Create User
                        </button>
                    )}
                </nav>

                {/* USER INFO + LOGOUT */}
                {authState?.isLoggedIn && authState?.user && (
                    <div className="mt-auto p-4 border-t border-gray-200 flex items-center gap-3 bg-gray-50">
                        <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                            {authState?.user?.name.charAt(0).toUpperCase()}
                        </div>

                        <span className="font-semibold text-gray-800 grow">
                            {authState?.user?.name}
                        </span>

                        <button
                            onClick={handleLogout}
                            className="px-3 py-1 text-sm border border-red-500 text-red-600 rounded-full hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
