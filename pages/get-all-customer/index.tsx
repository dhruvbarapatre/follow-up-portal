"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import EditCustomerModal from "../../components/my-list-com/EditCustomerModal";
import UserCard from "../../components/my-list-com/User-card";
import { toast } from "react-toastify";
import { PersistData } from "../../components/my-list-com/types";
import API from "@/components/apiClient";
import CustomerTable from "@/components/my-list-com/CustomerTable";

const UserListPage = () => {
  const auth = useSelector((s: PersistData) => s.auth);

  const [users, setUsers] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCustomerList, setLoadingCustomerList] = useState(true);
  const [assignCustomer, setAssignCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
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

  const loadCustomerList = async () => {
    setLoadingCustomerList(true);
    try {
      const res = await API.getAllCustomers(auth.user.userType);
      setCustomerList(res.data.data || []);
    } catch {
      toast.error("Failed to load customer list");
    }
    setLoadingCustomerList(false);
  };

  useEffect(() => {
    if (auth?.user?.role === "superAdmin" || auth?.user?.role === "admin") {
      loadUsers();
    }
    loadCustomerList();
  }, []);

  const Loader = () => (
    <div className="flex justify-center py-8">
      <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-10">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Customer List</h2>
          <span className="px-3 py-1 bg-sky-300 text-sm rounded-full">
            {customerList.length} Customers
          </span>
        </div>

        {loadingCustomerList ? (
          <Loader />
        ) : customerList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No customers found.
          </p>
        ) : (
          <CustomerTable
            list={customerList}
            onEdit={(c: any) => setEditCustomer(c)}
          />
        )}
      </div>
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
                    customerList={customerList}
                    onOpen={() => setSelectedUser(u)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {editCustomer && (
        <EditCustomerModal
          customer={editCustomer}
          users={users}
          onClose={() => setEditCustomer(null)}
          reload={loadCustomerList}
        />
      )}
    </div>
  );
};

export default UserListPage;
