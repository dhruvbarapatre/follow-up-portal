"use client";
import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { useSelector } from "react-redux";
import AssignModal from "../../components/my-list-com/AssignModal";
import UserCard from "../../components/my-list-com/User-card";
import { toast } from "react-toastify";
import { PersistData } from "../../components/my-list-com/types";
import API from "@/components/apiClient";

const UserListPage = () => {
    const auth = useSelector((s: PersistData) => s.auth);
    const [users, setUsers] = useState([]);
    const [unreserved, setUnreserved] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingUnreserved, setLoadingUnreserved] = useState(true);
    const [assignCustomer, setAssignCustomer] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await API.getAllUsers(auth.token, auth.user.userType);
            setUsers(res.data.data || []);
        } catch {
            toast.error("Failed to load users");
        }
        setLoadingUsers(false);
    };

    const loadUnreserved = async () => {
        setLoadingUnreserved(true);
        try {
            const res = await API.getUnReserved(auth.token, auth.user.userType);
            setUnreserved(res.data.data || []);
        } catch {
            toast.error("Failed to load unreserved list");
        }
        setLoadingUnreserved(false);
    };

    useEffect(() => {
        if (auth?.user?.role === "superAdmin" || auth?.user?.role === "admin") {
            loadUsers();
            loadUnreserved();
        }
    }, []);

    const Loader = () => (
        <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="p-6 space-y-10">
            {/* //unreserved customers section */}
            {/* {(auth?.user?.role === "superAdmin" || auth?.user?.role === "admin") && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Unreserved Customers</h2>
                        <span className="px-3 py-1 bg-yellow-400 text-sm rounded-full">
                            {unreserved.length} Customers
                        </span>
                    </div>

                    {loadingUnreserved ? (
                        <Loader />
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {unreserved.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 col-span-full">
                                    No unreserved customers.
                                </p>
                            ) : (
                                unreserved.map((c: any) => (
                                    <div
                                        key={c._id}
                                        className="p-4 bg-white shadow rounded-lg border-l-4 border-yellow-400 flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-semibold">{c.name}</p>
                                            <p className="text-gray-500 text-sm">{c.phoneNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => setAssignCustomer(c)}
                                            className="px-3 py-2 bg-yellow-500 text-white rounded-md flex items-center gap-1"
                                        >
                                            <UserPlus size={16} /> Assign
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )} */}

            {(auth?.user?.role === "superAdmin" || auth?.user?.role === "admin") && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold">Users</h1>
                        <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                            {users.length} Users
                        </span>
                    </div>

                    {loadingUsers ? (
                        <Loader />
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {users.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 col-span-full">
                                    No users found.
                                </p>
                            ) : (
                                users.map((u: any) => (
                                    <UserCard
                                        key={u._id}
                                        user={u}
                                        users={users}
                                        isOpen={true}
                                        onOpen={() => setSelectedUser(u)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {assignCustomer && (
                <AssignModal
                    customer={assignCustomer}
                    users={users}
                    onClose={() => setAssignCustomer(null)}
                    reload={loadUnreserved}
                />
            )}
        </div>
    );
};

export default UserListPage;
