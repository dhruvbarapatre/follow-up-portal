"use client";
import { useEffect, useRef, useState } from "react";
import { X, Phone, MessageCircle, Users } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import API from "@/components/apiClient";

export default function EditCustomerModal({
  customer,
  users,
  onClose,
  refreshCustomerList,
}: any) {
  const [original, setOriginal] = useState<any>(null);
  const [edited, setEdited] = useState<any>(null);

  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const [connInput, setConnInput] = useState({
    name: "",
    relation: "",
    phoneNumber: "",
  });

  const unsavedActionRef = useRef<any>(null);

  // Compare objects
  const isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

  // Check dirty whenever edited changes
  useEffect(() => {
    if (!original || !edited) return;
    setDirty(!isEqual(original, edited));
  }, [edited, original]);

  // LOAD DATA WHEN MODAL OPENS
  useEffect(() => {
    if (!customer) return;

    const clone = JSON.parse(JSON.stringify(customer));

    if (!Array.isArray(clone.goodConnectionWith))
      clone.goodConnectionWith = [];

    if (!clone.outOfStation)
      clone.outOfStation = {
        isOutOfStation: false,
        isOutOfStationPlace: "",
      };
    setOriginal(JSON.parse(JSON.stringify(clone)));
    setEdited(JSON.parse(JSON.stringify(clone)));
    setEditMode(false);
    setDirty(false);
  }, [customer]);

  if (!customer || !edited) return null;

  // --- FIELD HANDLERS ---
  const handleField = (key: string, value: any) => {
    setEdited({ ...edited, [key]: value });
  };

  const handleNested = (parent: string, key: string, value: any) => {
    setEdited({
      ...edited,
      [parent]: { ...(edited[parent] || {}), [key]: value },
    });
  };

  const addGoodConnection = () => {
    if (!connInput.name.trim()) {
      toast.error("Name required");
      return;
    }
    setEdited({
      ...edited,
      goodConnectionWith: [...edited.goodConnectionWith, connInput],
    });

    setConnInput({ name: "", relation: "", phoneNumber: "" });
  };

  const removeGoodConnection = (index: number) => {
    setEdited({
      ...edited,
      goodConnectionWith: edited.goodConnectionWith.filter(
        (_: any, i: number) => i !== index
      ),
    });
  };

  // --- CLOSE LOGIC ---
  const closeModal = () => {
    if (dirty) {
      unsavedActionRef.current = () => onClose();
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  };

  // --- SAVE CLICK ---
  const handleSave = () => setShowSaveConfirm(true);

  const performSave = async () => {
    setShowSaveConfirm(false);
    try {
      await API.editCustomer({
        _id: customer._id,
        updateData: edited,
      });

      setDirty(false);
      onClose();

      toast.success("Updated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update");
    }
  };

  // --- UNSAVED CHANGES ---
  const handleUnsavedChoice = (choice: string) => {
    setShowUnsavedModal(false);

    if (choice === "save") return performSave();

    if (choice === "discard") {
      setEdited(JSON.parse(JSON.stringify(original)));
      setDirty(false);
      setEditMode(false);

      if (unsavedActionRef.current) unsavedActionRef.current();
      else onClose();
    }
  };

  // WhatsApp
  const openWhatsapp = () => {
    const raw = (edited.phoneNumber || original.phoneNumber || "").toString();
    const cleaned = raw.replace(/\D/g, "");

    if (!cleaned) {
      toast.error("Invalid phone number");
      return;
    }

    const finalNum = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
    window.open(`https://wa.me/${finalNum}`, "_blank");
  };

  const getFollowUpUser = (whoCanFollowUps: string[]) => {
    if (!Array.isArray(whoCanFollowUps) || !users || !Array.isArray(users)) {
      return [];
    }

    return whoCanFollowUps
      .map((id) => users.find((u: any) => u._id === id))
      .filter(Boolean);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate consistent color for user
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
      "bg-violet-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const followUpUsers = getFollowUpUser(
    editMode ? edited.whoCanFollowUp || [] : original.whoCanFollowUp || []
  );

  // Toggle user in follow-up list
  const toggleFollowUpUser = (userId: string) => {
    const currentList = edited.whoCanFollowUp || [];
    const isAssigned = currentList.includes(userId);

    if (isAssigned) {
      setEdited({
        ...edited,
        whoCanFollowUp: currentList.filter((id: string) => id !== userId),
      });
    } else {
      setEdited({
        ...edited,
        whoCanFollowUp: [...currentList, userId],
      });
    }
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4 min-h-screen"
        onClick={closeModal}
      >
        {/* MODAL */}
        <div
          className="bg-white shadow-xl rounded-3xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-slideUp my-auto mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* FIXED HEADER */}
          <div className="p-4 sm:p-6 border-b border-gray-200 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl sm:text-2xl font-bold">
                {original.name || "Customer"}
              </h2>

              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors shrink-0"
              >
                <X size={22} />
              </button>
            </div>

            {/* MODE SWITCH */}
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-500">Mode:</span>

                <div className="flex gap-1.5">
                  <button
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${editMode
                      ? "bg-white border border-gray-300"
                      : "bg-blue-600 text-white"
                      }`}
                    onClick={() => setEditMode(false)}
                  >
                    View
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${editMode
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-300"
                      }`}
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </button>
                </div>
              </div>

              {editMode && (
                <button
                  onClick={handleSave}
                  disabled={!dirty}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium ${dirty
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  Save
                </button>
              )}
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            {/* FOLLOW-UP BY SECTION - MOBILE OPTIMIZED */}
            <div className="bg-linear-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-3 mb-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center w-100">
                    <div className="flex justify-between w-full">
                      <span className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                        <Users size={16} className="text-purple-600 shrink-0" />
                        Follow-up By:
                      </span>
                      {/* User count badge */}
                      {followUpUsers.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                            {followUpUsers.length}{" "}
                            {followUpUsers.length === 1 ? "User" : "Users"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {editMode && (
                    <span className="text-xs text-purple-600 font-medium">
                      Tap for select
                    </span>
                  )}
                </div>

                {/* VIEW MODE */}
                {!editMode && followUpUsers.length === 0 && (
                  <div className="flex items-center gap-2 text-gray-500 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users size={14} className="text-gray-400" />
                    </div>
                    <span className="text-xs italic">
                      No users assigned
                    </span>
                  </div>
                )}

                {!editMode && followUpUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
                    {followUpUsers.map((user: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white border border-purple-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm w-fit"
                      >
                        <div
                          className={`w-8 h-8 rounded-full ${getAvatarColor(
                            user.name
                          )} flex items-center justify-center text-white font-semibold text-xs shadow-md shrink-0`}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800 text-xs whitespace-nowrap">
                            {user.name}
                          </span>
                          {user.email && (
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* EDIT MODE - MOBILE OPTIMIZED */}
                {editMode && (
                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                    {users && users.length > 0 ? (
                      users.map((user: any) => {
                        const isAssigned = (edited.whoCanFollowUp || []).includes(
                          user._id
                        );
                        return (
                          <button
                            key={user._id}
                            onClick={() => toggleFollowUpUser(user._id)}
                            className={`relative rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm transition-all duration-200 w-fit ${isAssigned
                              ? "bg-white border-2 border-purple-500"
                              : "bg-white border border-gray-300"
                              }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full ${getAvatarColor(
                                user.name
                              )} flex items-center justify-center text-white font-semibold text-xs shadow-md shrink-0`}
                            >
                              {getInitials(user.name)}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="font-medium text-gray-800 text-xs whitespace-nowrap text-left">
                                {user.name}
                              </span>
                              {user.email && (
                                <span className="text-[10px] text-gray-500 whitespace-nowrap text-left">
                                  {user.email}
                                </span>
                              )}
                            </div>
                            {isAssigned && (
                              <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shrink-0 ml-1">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-gray-500 text-xs italic py-2">
                        No users available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* FORM FIELDS */}
            <div className="flex flex-col gap-3">
              {/* NAME */}
              <div>
                <label className="text-xs sm:text-sm text-gray-600 font-medium block mb-1">
                  Name
                </label>

                {editMode ? (
                  <input
                    className="border rounded-lg px-3 py-2 w-full text-sm"
                    value={edited.name}
                    onChange={(e) => handleField("name", e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-800">{original.name || "-"}</p>
                )}
              </div>

              {/* PHONE */}
              <div>
                <label className="text-xs sm:text-sm text-gray-600 font-medium block mb-1">
                  Phone
                </label>

                {editMode ? (
                  <input
                    className="border rounded-lg px-3 py-2 w-full text-sm"
                    value={edited.phoneNumber}
                    onChange={(e) => handleField("phoneNumber", e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-800">{original.phoneNumber || "-"}</p>
                )}
              </div>

              {/* AGE */}
              <div>
                <label className="text-xs sm:text-sm text-gray-600 font-medium block mb-1">
                  Age
                </label>

                {editMode ? (
                  <input
                    type="number"
                    className="border rounded-lg px-3 py-2 w-full text-sm"
                    value={edited.age || ""}
                    onChange={(e) => handleField("age", e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-800">{original.age || "-"}</p>
                )}
              </div>

              {/* CHANTING */}
              <div>
                <label className="text-xs sm:text-sm text-gray-600 font-medium block mb-1">
                  Chanting
                </label>

                {editMode ? (
                  <input
                    type="number"
                    className="border rounded-lg px-3 py-2 w-full text-sm"
                    value={edited.chanting || ""}
                    onChange={(e) => handleField("chanting", e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-800">{original.chanting || "-"}</p>
                )}
              </div>

              {/* OUT OF STATION PLACE */}
              {original.outOfStation?.isOutOfStation && (
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 font-medium block mb-1">
                    Out of Station Place
                  </label>

                  {editMode ? (
                    <input
                      className="border rounded-lg px-3 py-2 w-full text-sm"
                      value={edited.outOfStation.isOutOfStationPlace}
                      onChange={(e) =>
                        handleNested(
                          "outOfStation",
                          "isOutOfStationPlace",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {original.outOfStation?.isOutOfStationPlace || "-"}
                    </p>
                  )}
                </div>
              )}

              {/* ADDRESS */}
              <div>
                <label className="text-xs sm:text-sm text-gray-600 font-medium block mb-1">
                  Address
                </label>

                {editMode ? (
                  <textarea
                    className="border rounded-lg px-3 py-2 w-full text-sm min-h-[60px]"
                    value={edited.address || ""}
                    onChange={(e) => handleField("address", e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-800">{original.address || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* FIXED FOOTER */}
          {!editMode && (
            <div className="p-4 sm:p-6 border-t border-gray-200 shrink-0">
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2.5 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-sm active:scale-95 transition-transform"
                  onClick={() =>
                    (window.location.href = `tel:${original.phoneNumber}`)
                  }
                >
                  <Phone size={16} /> Call
                </button>

                <button
                  className="flex-1 px-3 py-2.5 bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-sm active:scale-95 transition-transform"
                  onClick={openWhatsapp}
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SAVE CONFIRMATION */}
      {showSaveConfirm && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-99999"
          onClick={() => setShowSaveConfirm(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-2">Save changes?</h3>

            <p className="text-gray-600 mb-4">
              Are you sure you want to save?
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white"
                onClick={performSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES */}
      {showUnsavedModal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-99999"
          onClick={() => setShowUnsavedModal(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-2">Unsaved Changes</h3>

            <p className="text-gray-600 mb-4">
              Save changes before closing?
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200"
                onClick={() => handleUnsavedChoice("cancel")}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-red-500 text-white"
                onClick={() => handleUnsavedChoice("discard")}
              >
                Discard
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white"
                onClick={() => handleUnsavedChoice("save")}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
}