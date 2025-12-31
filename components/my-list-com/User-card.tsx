"use client";
import { Phone, MessageCircle, X } from "lucide-react";
import API from "../apiClient";
import { useSelector } from "react-redux";
import { PersistData } from "./types";
import { use, useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

// Simple Popup Component
function UserPopup({ isOpen, onClose, user }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90%] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">User Details</h2>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <p className="font-medium">{user?.name}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-600">Phone Number</label>
            <p className="font-medium">{user?.phoneNumber}</p>
          </div>

          {/* Add more user data fields here as needed */}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => window.location.href = `tel:${user?.phoneNumber}`}
            className="flex-1 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            <Phone size={18} />
            Call
          </button>

          <button
            onClick={() => {
              const phone = user?.phoneNumber;
              const raw = typeof phone === "string" ? phone : String(phone || "");
              const cleaned = raw.replace(/\D/g, "");
              const finalNum = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
              window.open(`https://wa.me/${finalNum}`, "_blank");
            }}
            className="flex-1 p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserCard({ user, users, onOpen }: any) {
  const auth = useSelector((s: PersistData) => s.auth);
  const [userdata, setuserdata] = useState(users);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const getUserListFromApi = async () => {
    try {
      const res = await API.getUserList(auth.user.id, auth.user.userType);
      setuserdata(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load users");
    }
  }

  useEffect(() => {
    if (!users?.length) {
      getUserListFromApi();
    } else {
      setuserdata(users);
    }
  }, [users])

  const openWhatsapp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const phone = user?.phoneNumber;

    // Ensure phone is a string
    const raw = typeof phone === "string" ? phone : String(phone || "");

    // Keep only digits
    const cleaned = raw.replace(/\D/g, "");

    // Auto-add +91
    const finalNum = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

    window.open(`https://wa.me/${finalNum}`, "_blank");
  }

  const handleCardClick = () => {
    if (onOpen) {
      onOpen();
    }
    setIsPopupOpen(true);
  }

  return (
    <>
      <div
        className="backdrop-blur-xl bg-white/40 shadow-xl border border-white/30 rounded-2xl p-5 cursor-pointer 
        transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        onClick={handleCardClick}
      >
        <h3 className="text-lg font-semibold">{user.name}</h3>
        <p className="text-gray-600 text-sm">{user.phoneNumber}</p>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${user.phoneNumber}`;
            }}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            <Phone size={18} />
          </button>

          <button
            onClick={(e) => openWhatsapp(e)}
            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
          >
            <MessageCircle size={18} />
          </button>
        </div>
        <ToastContainer />
      </div>

      <UserPopup 
        isOpen={isPopupOpen} 
        onClose={() => setIsPopupOpen(false)} 
        user={user} 
      />
    </>
  );
}