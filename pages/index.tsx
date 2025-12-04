import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "@/components/slices/authSlice";
import { useRouter } from "next/router";
import { PersistData } from "./my-list/types";

axios.defaults.withCredentials = true;

const Home: React.FC = () => {
  const authState = useSelector((state: PersistData) => state.auth);
  const dispatch = useDispatch();

  const [modalType, setModalType] = useState<"youth" | "householder" | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "" });
  const router = useRouter();

  // ------------------ Modal Controls ------------------
  const openModal = (type: "youth" | "householder") => {
    if (!authState.isLoggedIn) {
      toast.error("Please log in first!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      return;
    }

    setForm({ name: "", phone: "" });
    setModalType(type);
  };

  const closeModal = () => setModalType(null);

  // ------------------ Input Handler ------------------
  const handleInput = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ------------------ Submit Handler ------------------
  const handleSubmit = async () => {
    const { name, phone } = form;

    if (!name || !phone) return toast.error("Please fill all fields!");

    if (!authState?.user?.id)
      return toast.error("User not authenticated!");

    const payload = {
      name,
      phoneNumber: phone,
      userType: modalType,
      adderId: authState?.user?.id,
    };

    try {
      setLoading(true);

      const res = await axios.post("/api/customer/add-customer", payload);

      toast.success(
        res.data.message ||
        `${modalType === "youth" ? "Youth" : "Householder"} added successfully!`
      );

      closeModal();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Check User ------------------
  const checkUser = async () => {
    const token = localStorage.getItem("fyp_token");
    if (!token || authState?.isLoggedIn) return;

    try {
      const res = await axios.post("/api/user/check-user", { fyp_token: token });
      const { id, name, phoneNumber, role, userType } = res.data.data;

      dispatch(
        loginSuccess({ id, name, phone: phoneNumber, role, token, userType })
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Session expired.");
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  return (
    <div className="p-6 sm:p-10 font-inter min-h-screen bg-gray-50">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-6">

        {/* Add Youth */}
        <button
          className="px-8 py-4 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 
                     shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          onClick={() => openModal("youth")}
        >
          + Add Youth
        </button>

        {/* Add Householder */}
        <button
          className="px-8 py-4 rounded-xl text-white font-semibold bg-green-600 hover:bg-green-700 
                     shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          onClick={() => openModal("householder")}
        >
          + Add Gṛhastha
        </button>

      </div>

      {/* ------------------- Modal ------------------- */}
      {modalType && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-opacity-50 
                     backdrop-blur-sm z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Add New {modalType === "youth" ? "Youth" : "Gṛhastha"}
            </h3>

            {/* Input: Name */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                name="name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg
                           focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={form.name}
                onChange={handleInput}
                placeholder="Enter full name"
              />
            </div>

            {/* Input: Phone */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                name="phone"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg
                           focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={form.phone}
                onChange={handleInput}
                placeholder="Enter phone number"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg 
                           shadow-md transition disabled:bg-indigo-400"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Adding..." : "Add "}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-left" autoClose={3000} />
    </div>
  );
};

export default Home;
