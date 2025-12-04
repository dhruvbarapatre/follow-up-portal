"use client";
import { Phone, MessageCircle } from "lucide-react";

export default function UserCard({ user, onOpen }: any) {
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

  return (
    <div
      className="backdrop-blur-xl bg-white/40 shadow-xl border border-white/30 rounded-2xl p-5 cursor-pointer 
      transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      onClick={onOpen}
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
    </div>
  );
}
