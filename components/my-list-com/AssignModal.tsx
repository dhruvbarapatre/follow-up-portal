"use client";
import { X, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import { PersistData } from "./types";
import API from "@/components/apiClient";

// declare global {
//   interface Window {
//     _USERS?: any[];
//   }
// }

export default function AssignModal({ customer, users, onClose, reload }: any) {
  const [selected, setSelected] = useState("");
  const [assigned, setAssigned] = useState<any[]>([]);
  const [userList, setUserList] = useState(users || []);
  const auth = useSelector((s: PersistData) => s.auth);


  const handleAdd = () => {
    if (!selected) return toast.error("Select a user");

    if (assigned.find((u: any) => u._id === selected)) {
      return toast.error("Already added");
    }

    const user = userList?.find((u: any) => u._id === selected);
    if (user) setAssigned([...assigned, user]);
    setSelected("");
  };

  const handleSubmit = async () => {
    if (assigned.length === 0)
      return toast.error("Add at least one user");

    const payload = {
      customerId: customer._id,
      UsersIds: assigned.map((u: any) => u._id),
      userType: auth.user.userType,
    };

    const res = await API.assignCustomer(payload);
    toast.success(res.data.message || "Assigned!");
    reload();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-xl animate-fadeIn">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold">Assign Customer</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <p className="font-semibold text-lg">{customer.name}</p>
        <p className="text-gray-600">{customer.phoneNumber}</p>

        {/* User Select */}
        <div className="mt-5">
          <label className="font-semibold">Select User</label>
          <div className="flex gap-2 mt-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="border rounded-md px-3 py-2 flex-1"
            >
              <option value="">-- Select --</option>
              {userList?.map((u: any) => (
                <option key={u._id} value={u._id}>
                  {u.name} -- {u.phoneNumber}
                </option>
              ))}
            </select>

            <button
              onClick={handleAdd}
              className="px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
            >
              <UserPlus size={18} /> Add
            </button>
          </div>
        </div>

        {/* Assigned List */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-1">
            {assigned.length} user(s) assigned
          </p>
          <div className="flex flex-wrap gap-2">
            {assigned.map((u: any) => (
              <div
                key={u._id}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg flex items-center gap-2"
              >
                {u.name}
                <button
                  onClick={() =>
                    setAssigned(assigned.filter((x: any) => x._id !== u._id))
                  }
                  className="hover:bg-blue-700 rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
          >
            <UserPlus size={18} />
            Submit
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
