"use client";
import { useEffect, useRef, useState } from "react";
import { X, Phone, MessageCircle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import API from "@/components/apiClient";

export default function EditCustomerModal({
  customer,
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

  // --- THE MAIN FIX YOU ASKED FOR ---
  // ✔ Save API
  // ✔ Close modal
  // ❌ Do NOT update UI/states
  // ❌ Do NOT refresh parent
  // ❌ Do NOT modify view data
  const performSave = async () => {
    setShowSaveConfirm(false);
    try {
      await API.editCustomer({
        _id: customer._id,
        updateData: edited,
      });

      // Only close modal — your requirement
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

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-9999"
        onClick={closeModal}
      >
        {/* MODAL */}
        <div
          className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-3xl animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {original.name || "Customer"}
            </h2>

            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              <X size={22} />
            </button>
          </div>

          {/* MODE SWITCH */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Mode:</span>

              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-md text-sm ${
                    editMode
                      ? "bg-white border"
                      : "bg-blue-600 text-white"
                  }`}
                  onClick={() => setEditMode(false)}
                >
                  View
                </button>
                <button
                  className={`px-3 py-1 rounded-md text-sm ${
                    editMode
                      ? "bg-blue-600 text-white"
                      : "bg-white border"
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
                className={`px-4 py-2 text-sm rounded-md ${
                  dirty
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Save
              </button>
            )}
          </div>

          {/* BODY */}
          <div
            className={`${
              editMode ? "" : "grid grid-cols-1 md:grid-cols-2"
            } gap-4 max-h-[60vh] overflow-y-auto pr-2`}
          >
            {/* NAME */}
            <div>
              <label className="text-sm text-gray-600">Name</label>

              {editMode ? (
                <input
                  className="border rounded-lg px-3 py-2 w-full"
                  value={edited.name}
                  onChange={(e) =>
                    handleField("name", e.target.value)
                  }
                />
              ) : (
                <p>{original.name || "-"}</p>
              )}
            </div>

            {/* PHONE */}
            <div>
              <label className="text-sm text-gray-600">Phone</label>

              {editMode ? (
                <input
                  className="border rounded-lg px-3 py-2 w-full"
                  value={edited.phoneNumber}
                  onChange={(e) =>
                    handleField("phoneNumber", e.target.value)
                  }
                />
              ) : (
                <p>{original.phoneNumber || "-"}</p>
              )}
            </div>

            {/* AGE */}
            <div>
              <label className="text-sm text-gray-600">Age</label>

              {editMode ? (
                <input
                  type="number"
                  className="border rounded-lg px-3 py-2 w-full"
                  value={edited.age || ""}
                  onChange={(e) =>
                    handleField("age", e.target.value)
                  }
                />
              ) : (
                <p>{original.age || "-"}</p>
              )}
            </div>

            {/* CHANTING */}
            <div>
              <label className="text-sm text-gray-600">Chanting</label>

              {editMode ? (
                <input
                  type="number"
                  className="border rounded-lg px-3 py-2 w-full"
                  value={edited.chanting || ""}
                  onChange={(e) =>
                    handleField("chanting", e.target.value)
                  }
                />
              ) : (
                <p>{original.chanting || "-"}</p>
              )}
            </div>

            {/* OUT OF STATION */}
            <div>
              <label className="text-sm text-gray-600">
                Out of Station
              </label>

              {editMode ? (
                <select
                  className="border rounded-lg px-3 py-2 w-full"
                  value={
                    edited.outOfStation?.isOutOfStation
                      ? "yes"
                      : "no"
                  }
                  onChange={(e) =>
                    handleNested(
                      "outOfStation",
                      "isOutOfStation",
                      e.target.value === "yes"
                    )
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              ) : (
                <p>
                  {original.outOfStation?.isOutOfStation
                    ? "Yes"
                    : "No"}
                </p>
              )}
            </div>

            {/* OUT OF STATION PLACE */}
            {original.outOfStation?.isOutOfStation && (
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Place</label>

                {editMode ? (
                  <input
                    className="border rounded-lg px-3 py-2 w-full"
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
                  <p>
                    {original.outOfStation?.isOutOfStationPlace ||
                      "-"}
                  </p>
                )}
              </div>
            )}

            {/* ADDRESS */}
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Address</label>

              {editMode ? (
                <textarea
                  className="border rounded-lg px-3 py-2 w-full"
                  value={edited.address || ""}
                  onChange={(e) =>
                    handleField("address", e.target.value)
                  }
                />
              ) : (
                <p>{original.address || "-"}</p>
              )}
            </div>

            {/* GOOD CONNECTIONS */}
            <div className="col-span-2">
              <label className="text-sm text-gray-600">
                Good Connections
              </label>

              {/* VIEW CONNECTIONS */}
              {!editMode && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {original.goodConnectionWith.map(
                    (gc: any, index: number) => (
                      <div
                        key={index}
                        className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2"
                      >
                        <span>
                          {gc.name}{" "}
                          {gc.relation && `(${gc.relation})`}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* EDIT CONNECTIONS */}
              {editMode && (
                <>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {edited.goodConnectionWith.map(
                      (gc: any, index: number) => (
                        <div
                          key={index}
                          className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2"
                        >
                          <span>
                            {gc.name}{" "}
                            {gc.relation && `(${gc.relation})`}
                          </span>

                          <button
                            onClick={() =>
                              removeGoodConnection(index)
                            }
                            className="p-1 hover:bg-blue-800 rounded-full"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <input
                      className="border rounded-lg px-2 py-2"
                      placeholder="Name"
                      value={connInput.name}
                      onChange={(e) =>
                        setConnInput({
                          ...connInput,
                          name: e.target.value,
                        })
                      }
                    />

                    <input
                      className="border rounded-lg px-2 py-2"
                      placeholder="Relation"
                      value={connInput.relation}
                      onChange={(e) =>
                        setConnInput({
                          ...connInput,
                          relation: e.target.value,
                        })
                      }
                    />

                    <div className="flex gap-2">
                      <input
                        className="border rounded-lg px-2 py-2 w-full"
                        placeholder="Phone"
                        value={connInput.phoneNumber}
                        onChange={(e) =>
                          setConnInput({
                            ...connInput,
                            phoneNumber: e.target.value,
                          })
                        }
                      />

                      <button
                        onClick={addGoodConnection}
                        className="bg-green-600 text-white px-3 rounded-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* FOOTER */}
          {!editMode && (
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
                onClick={() =>
                  (window.location.href = `tel:${original.phoneNumber}`)
                }
              >
                <Phone size={18} /> Call
              </button>

              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"
                onClick={openWhatsapp}
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
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
