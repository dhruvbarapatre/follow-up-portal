import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "@/components/slices/authSlice";
import { useRouter } from "next/router";
import { PersistData } from "../components/my-list-com/types";
import { UserPlus, Heart, Sparkles, Users, BarChart3 } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;

const Home: React.FC = () => {
  const authState = useSelector((state: PersistData) => state.auth);
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "" });
  const router = useRouter();

  // ------------------ Modal Controls ------------------
  const openModal = () => {
    if (!authState.isLoggedIn) {
      toast.error("Please log in first!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      return;
    }

    setForm({ name: "", phone: "" });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

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
      userType: "youth",
      adderId: authState?.user?.id,
    };

    try {
      setLoading(true);

      const res = await axios.post("/api/customer/add-customer", payload);

      toast.success(
        res.data.message || "Youth added successfully!"
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
    <div className="p-6 sm:p-10 font-sans min-h-[calc(100vh-65px)] flex flex-col justify-between bg-neutral-50/20 dark:bg-zinc-950/20">
      {/* Welcome Banner */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto mb-10 mt-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mb-6 shadow-sm">
          <Sparkles className="text-indigo-600 dark:text-indigo-400 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-800 dark:text-zinc-100 font-display tracking-tight leading-tight">
          Welcome to Follow Up Portal
        </h1>
        <p className="text-neutral-500 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
          Manage your youth follow-ups, schedule classes, and stay connected with your team in real-time.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 w-full space-y-3">
          <button
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-100 dark:shadow-none"
            onClick={() => router.push("/follow-up-hub")}
          >
            <Users size={16} />
            <span>Youth Directory</span>
          </button>

          <button
            className="w-full py-3.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
            onClick={() => router.push("/analytics")}
          >
            <BarChart3 size={16} />
            <span>View Analytics</span>
          </button>

          <button
            className="w-full py-3.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 border border-indigo-100 dark:border-indigo-900/30"
            onClick={openModal}
          >
            <UserPlus size={16} />
            <span>Add Youth</span>
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center py-4 shrink-0">
        <p className="text-[10px] text-neutral-400 dark:text-zinc-500 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
          Made with <Heart size={10} className="fill-rose-400 stroke-rose-400" /> for community followups
        </p>
      </div>

      {/* ------------------- Add Youth Modal ------------------- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-sm z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800/80 w-full max-w-md p-6 rounded-2xl shadow-xl overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-5 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800 dark:text-zinc-100">Add New Youth</h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">Insert details to assign to the list</p>
              </div>
            </div>

            {/* Input: Name */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                name="name"
                className="w-full premium-input"
                value={form.name}
                onChange={handleInput}
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Input: Phone */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                name="phone"
                type="tel"
                className="w-full premium-input"
                value={form.phone}
                onChange={handleInput}
                placeholder="Enter phone number"
                required
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 border-t border-neutral-100 dark:border-zinc-800/80 pt-4 mt-6">
              <button
                className="px-4 py-2 border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold text-neutral-600 dark:text-zinc-400 transition"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-50/50 disabled:bg-indigo-400 transition"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Adding..." : "Add Youth"}
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
