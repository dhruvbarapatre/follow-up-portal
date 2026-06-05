import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Calendar, Clock, Plus, Trash2, Edit2, Check, X, Users, Search, Phone, FileText } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import API from "@/components/apiClient";
import { useCallingTracker } from "../../components/my-list-com/useCallingTracker";
import CallResponseModal from "../../components/my-list-com/CallResponseModal";
import EditCustomerModal from "../../components/my-list-com/EditCustomerModal";
import { getSocket } from "@/lib/socket";
import "react-toastify/dist/ReactToastify.css";

interface Program {
  _id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  invitedCustomers: any[];
}

export default function ProgramScheduler() {
  const auth = useSelector((s: any) => s.auth);
  const currentUser = auth?.user;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null); // selected program ID to view invite list

  // Hook for handling phone calls and websocket status in real-time
  const {
    activeCallCustomer,
    liveCallingStates,
    initiateCall,
    handleModalClose,
    activeCallProgramId,
  } = useCallingTracker(currentUser, () => {
    // When a call response is submitted, refresh the program invites list
    fetchPrograms();
  });

  const fetchPrograms = async () => {
    try {
      const res = await API.getPrograms();
      setPrograms(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load scheduled programs");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await API.getAllCustomers();
      setCustomers(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load customer list");
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await API.getAllUsers(auth.token);
      setVolunteers(res.data.data || []);
    } catch (err) {
      console.error("Failed to load volunteers:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    const promises = [fetchPrograms(), fetchCustomers()];
    if (auth?.token) {
      promises.push(fetchVolunteers());
    }
    Promise.all(promises).finally(() => {
      setLoading(false);
    });
  }, [auth?.token]);

  // Real-time synchronization for responses and details via WebSockets
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const handleStop = () => {
      fetchPrograms();
    };

    const handleUpdate = () => {
      fetchPrograms();
      fetchCustomers();
    };

    socket.on("calling-stop", handleStop);
    socket.on("customer-update", handleUpdate);
    socket.on("attendance-update", handleUpdate);

    return () => {
      socket.off("calling-stop", handleStop);
      socket.off("customer-update", handleUpdate);
      socket.off("attendance-update", handleUpdate);
    };
  }, []);

  const handleInviteToggle = (id: string) => {
    if (selectedInviteIds.includes(id)) {
      setSelectedInviteIds(selectedInviteIds.filter((x) => x !== id));
    } else {
      setSelectedInviteIds([...selectedInviteIds, id]);
    }
  };

  const handleSelectAllInvites = () => {
    const filtered = customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredIds = filtered.map(c => c._id);
    
    // Check if all filtered are already selected
    const allSelected = filteredIds.every(id => selectedInviteIds.includes(id));
    if (allSelected) {
      // Unselect all filtered
      setSelectedInviteIds(selectedInviteIds.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered (keeping other selections)
      setSelectedInviteIds(Array.from(new Set([...selectedInviteIds, ...filteredIds])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time) {
      return toast.error("Please fill in title, date, and time.");
    }

    try {
      setLoading(true);
      if (editingId) {
        // Edit program
        await API.updateProgram({
          id: editingId,
          title: formData.title,
          date: formData.date,
          time: formData.time,
          description: formData.description,
          invitedCustomerIds: selectedInviteIds,
        });
        toast.success("Program updated successfully!");
      } else {
        // Create program
        if (currentUser?.role !== "superAdmin") {
          return toast.error("Only Super Admins can create events.");
        }
        await API.createProgram({
          title: formData.title,
          date: formData.date,
          time: formData.time,
          description: formData.description,
          invitedCustomerIds: selectedInviteIds,
        });
        toast.success("Program scheduled successfully!");
        
        // Notify others of newly created event
        const socket = getSocket();
        socket.emit("new-notification", {
          type: "new-event",
          message: `New event scheduled: '${formData.title}'`,
          createdAt: new Date(),
          title: formData.title,
        });
      }

      setFormData({ title: "", date: "", time: "", description: "" });
      setSelectedInviteIds([]);
      setEditingId(null);
      setIsAdding(false);
      fetchPrograms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save program.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (program: Program) => {
    // Format date string from DB (e.g. YYYY-MM-DD)
    const formattedDate = program.date ? new Date(program.date).toISOString().split("T")[0] : "";
    setFormData({
      title: program.title,
      date: formattedDate,
      time: program.time,
      description: program.description || "",
    });
    setSelectedInviteIds(program.invitedCustomers.map((ic: any) => ic.customerId?._id || ic.customerId));
    setEditingId(program._id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      setLoading(true);
      await API.deleteProgram(id);
      toast.success("Program deleted.");
      if (activeTab === id) setActiveTab(null);
      fetchPrograms();
    } catch (err) {
      toast.error("Failed to delete program.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ title: "", date: "", time: "", description: "" });
    setSelectedInviteIds([]);
    setIsAdding(false);
    setEditingId(null);
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) return timeStr;
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours}:${minutes} ${ampm}`;
  };

  const getAssignedNames = (whoCanFollowUp: string[]) => {
    if (!whoCanFollowUp || !Array.isArray(whoCanFollowUp)) return "Unassigned";
    const names = whoCanFollowUp
      .map((id) => volunteers.find((v: any) => v._id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Unassigned";
  };

  const getResponseBadge = (response: string) => {
    switch (response?.toLowerCase()) {
      case "comes to youth class":
        return <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded-full">Comes to class</span>;
      case "try to come":
        return <span className="text-[9px] font-bold px-2 py-0.5 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 rounded-full">Try to come</span>;
      case "out of station":
        return <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-full">Out of station</span>;
      case "excuse":
        return <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-zinc-700/50 rounded-full">Excuse</span>;
      case "no":
        return <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-full">No</span>;
      case "not picked up":
        return <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-full">No Answer</span>;
      default:
        return <span className="text-[9px] font-bold px-2 py-0.5 bg-neutral-50 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-zinc-700 rounded-full">Pending</span>;
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div className="animate-fadeIn space-y-6">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-zinc-800/80">
          <div>
            <h1 className="text-lg font-bold text-neutral-800 dark:text-zinc-100 font-display uppercase tracking-tight">Event Manager</h1>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">Schedule events and track invitees</p>
          </div>
          {!isAdding && currentUser?.role === "superAdmin" && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-100"
            >
              <Plus size={16} /> New Event
            </button>
          )}
        </div>

        {/* PROGRAM CARDS LISTING */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-100 dark:border-zinc-800/80 shadow-premium">
              <Calendar size={40} className="mx-auto mb-3 text-neutral-300 dark:text-zinc-700" />
              <p className="text-xs text-neutral-500 dark:text-zinc-400 font-semibold">No scheduled events yet</p>
              <p className="text-[10px] text-neutral-400 dark:text-zinc-550 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Click the 'New Event' button above to create event schedules.
              </p>
            </div>
          ) : (
            programs.map((program) => {
              const isExpanded = activeTab === program._id;
              const programDate = new Date(program.date);
              
              return (
                <div
                  key={program._id}
                  className={`bg-white dark:bg-zinc-900 border rounded-2xl shadow-premium overflow-hidden transition-all duration-200 ${
                    isExpanded 
                      ? "border-indigo-200 dark:border-indigo-800/80 ring-2 ring-indigo-50 dark:ring-indigo-950/40" 
                      : "border-neutral-100 dark:border-zinc-800/80 hover:border-neutral-200 dark:hover:border-zinc-750"
                  }`}
                >
                  {/* Card Main Bar */}
                  <div
                    className="p-4 sm:p-5 flex justify-between items-start cursor-pointer hover:bg-neutral-50/20 dark:hover:bg-zinc-800/20"
                    onClick={() => setActiveTab(isExpanded ? null : program._id)}
                  >
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-neutral-800 dark:text-zinc-100 tracking-tight">
                        {program.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-500 dark:text-zinc-400 font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-neutral-400 dark:text-zinc-550" />
                          {programDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-neutral-400 dark:text-zinc-550" />
                          {formatTime12h(program.time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={13} className="text-neutral-400 dark:text-zinc-550" />
                          {program.invitedCustomers?.length || 0} Invited
                        </span>
                      </div>

                      {program.description && (
                        <p className="text-xs text-neutral-400 dark:text-zinc-500 italic line-clamp-1 leading-relaxed">
                          {program.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1.5 self-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(program)}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-xl transition duration-150 active:scale-90"
                        title="Edit program"
                      >
                        <Edit2 size={14} />
                      </button>
                      {currentUser?.role === "superAdmin" && (
                        <button
                          onClick={() => handleDelete(program._id)}
                          className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition duration-150 active:scale-90"
                          title="Delete program"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Follow-up invite list */}
                  {isExpanded && (
                    <div className="bg-neutral-50/50 dark:bg-zinc-950/30 border-t border-neutral-100 dark:border-zinc-800/80 p-4 animate-fadeIn space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider">
                          Invite Follow Up List
                        </h4>
                      </div>

                      {program.invitedCustomers?.length === 0 ? (
                        <p className="text-xs text-neutral-400 dark:text-zinc-550 italic py-2">
                          No youth invited to this program. Edit event to add invites.
                        </p>
                      ) : (() => {
                        const invitedList = program.invitedCustomers || [];
                        const myInvites = invitedList.filter((ic: any) => {
                          const c = ic.customerId;
                          if (!c) return false;
                          const assignedIds = c.whoCanFollowUp || [];
                          return assignedIds.includes(currentUser?.id);
                        });
                        const otherInvites = invitedList.filter((ic: any) => {
                          const c = ic.customerId;
                          if (!c) return false;
                          const assignedIds = c.whoCanFollowUp || [];
                          return !assignedIds.includes(currentUser?.id);
                        });

                        const renderInviteTable = (invitesList: any[], label: string, isMyList: boolean) => (
                          <div className="space-y-2">
                            <h5 className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between ${
                              isMyList ? "text-indigo-600 dark:text-indigo-400" : "text-neutral-500 dark:text-zinc-400"
                            }`}>
                              <span>{label}</span>
                              <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-[9px] font-bold text-neutral-500 dark:text-zinc-400">
                                {invitesList.length}
                              </span>
                            </h5>
                            {invitesList.length === 0 ? (
                              <p className="text-[10px] text-neutral-400 dark:text-zinc-555 italic py-2 pl-1">
                                No invites in this section.
                              </p>
                            ) : (
                              <div className="overflow-hidden rounded-xl border border-neutral-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                                <table className="min-w-full text-xs">
                                  <thead>
                                    <tr className="bg-neutral-50 dark:bg-zinc-950/40 border-b border-neutral-100 dark:border-zinc-800/80">
                                      <th className="text-left font-bold text-neutral-500 dark:text-zinc-400 p-2.5 uppercase tracking-wider">Name</th>
                                      <th className="text-left font-bold text-neutral-500 dark:text-zinc-400 p-2.5 uppercase tracking-wider">Assigned To</th>
                                      <th className="text-left font-bold text-neutral-500 dark:text-zinc-400 p-2.5 uppercase tracking-wider">Call State</th>
                                      <th className="text-right font-bold text-neutral-500 dark:text-zinc-400 p-2.5 uppercase tracking-wider">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {invitesList.map((ic: any) => {
                                      const c = ic.customerId;
                                      if (!c) return null;

                                      const isCallingLocally = liveCallingStates[c._id]?.status === "calling" || c.callingStatus === "calling";
                                      const caller = liveCallingStates[c._id]?.callingBy || c.callingBy;

                                      return (
                                        <tr key={ic._id || c._id} className="border-b border-neutral-100 dark:border-zinc-800/50 last:border-none hover:bg-neutral-50/30 dark:hover:bg-zinc-800/20 transition">
                                          <td 
                                            className="p-2.5 font-semibold text-neutral-800 dark:text-zinc-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                            onClick={() => setSelectedCustomer(c)}
                                          >
                                            <div className="flex flex-col">
                                              <span>{c.name}</span>
                                              <span className="text-[10px] text-neutral-400 dark:text-zinc-550 font-normal mt-0.5">{c.phoneNumber}</span>
                                            </div>
                                          </td>
                                          <td className="p-2.5 text-neutral-600 dark:text-zinc-400">
                                            <span className="text-[10px] font-medium">{getAssignedNames(c.whoCanFollowUp)}</span>
                                          </td>
                                          <td className="p-2.5">
                                            <div className="flex flex-col gap-0.5">
                                              {isCallingLocally ? (
                                                <span className="text-[9px] font-extrabold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-full animate-pulse flex items-center gap-1 w-fit">
                                                  <Phone size={9} className="animate-bounce" />
                                                  <span>{caller} calling...</span>
                                                </span>
                                              ) : (
                                                getResponseBadge(ic.response)
                                              )}
                                              {ic.callingBy && (
                                                <span className="text-[9px] text-neutral-400 dark:text-zinc-500 mt-0.5 font-sans">
                                                  Done by: {ic.callingBy}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="p-2.5 text-right">
                                            <button
                                              onClick={() => initiateCall(c, program._id)}
                                              disabled={isCallingLocally && caller !== currentUser?.name}
                                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ml-auto active:scale-95 ${
                                                isCallingLocally && caller !== currentUser?.name
                                                  ? "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-650 cursor-not-allowed border-none shadow-none"
                                                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                              }`}
                                            >
                                              <Phone size={10} /> Call
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );

                        return (
                          <div className="space-y-4 w-full">
                            {renderInviteTable(myInvites, "Assigned to Me", true)}
                            <div className="border-t border-neutral-100 dark:border-zinc-800/80 my-2 pt-2"></div>
                            {renderInviteTable(otherInvites, "Others / Unassigned", false)}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FORM FOR ADDING/EDITING (MODAL) */}
      {isAdding && (
        <div
          className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/60 flex items-center justify-center z-50 p-4 backdrop-blur-md"
          onClick={handleCancel}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 w-full max-w-md p-6 rounded-2xl shadow-xl overflow-y-auto max-h-[90%] animate-slideUp space-y-4 flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-1 pb-3 border-b border-neutral-100 dark:border-zinc-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 dark:text-zinc-100">
                    {editingId ? "Edit Scheduled Event" : "Schedule New Event"}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400">Fill details for the program</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-neutral-400 dark:text-zinc-550 hover:text-neutral-600 dark:hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable container) */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 py-1 scrollable-content">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 dark:text-zinc-550 uppercase tracking-wider mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full premium-input py-2 text-xs"
                  placeholder="e.g. Youth Awakening Class"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full premium-input py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full premium-input py-2 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 dark:text-zinc-555 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full premium-input text-xs min-h-[60px]"
                  placeholder="Details about program syllabus, location, or preacher..."
                  rows={2}
                />
              </div>

              {/* Invite checklist */}
              <div className="border-t border-neutral-100 dark:border-zinc-800/80 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-semibold text-neutral-400 dark:text-zinc-555 uppercase tracking-wider">
                    Invite Youth ({selectedInviteIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllInvites}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Select All Filtered
                  </button>
                </div>

                {/* Search checklist */}
                <div className="relative mb-2">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-555">
                    <Search size={12} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search youth by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full premium-input pl-7 py-1 text-xs"
                  />
                </div>

                {/* Youth checklist list wrapper */}
                <div className="border border-neutral-100 dark:border-zinc-800/80 rounded-xl max-h-[150px] overflow-y-auto scrollable-content p-2 bg-neutral-50/50 dark:bg-zinc-950/40 space-y-1">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-[10px] text-neutral-400 dark:text-zinc-500 italic text-center py-4">No youth found matching name.</p>
                  ) : (
                    filteredCustomers.map((c) => {
                      const isChecked = selectedInviteIds.includes(c._id);
                      return (
                        <label
                          key={c._id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${
                            isChecked 
                              ? "bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold text-indigo-700 dark:text-indigo-400" 
                              : "hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40 text-neutral-600 dark:text-zinc-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleInviteToggle(c._id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{c.name}</span>
                          <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-normal">({c.phoneNumber})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="flex gap-2 border-t border-neutral-100 dark:border-zinc-800/80 pt-4 mt-2 shrink-0">
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-50"
              >
                <Check size={14} />
                {editingId ? "Update Event" : "Schedule Event"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-205 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CALL FEEDBACK MODAL OVERLAY */}
      {activeCallCustomer && (
        <CallResponseModal
          customer={activeCallCustomer}
          currentUser={currentUser}
          programId={activeCallProgramId || undefined}
          onClose={handleModalClose}
        />
      )}

      {/* CLICKED USER DETAIL MODAL */}
      {selectedCustomer && (
        <EditCustomerModal
          customer={selectedCustomer}
          users={volunteers}
          onClose={() => setSelectedCustomer(null)}
          refreshCustomerList={() => {
            fetchPrograms();
            fetchCustomers();
          }}
        />
      )}

      <ToastContainer position="bottom-left" autoClose={3000} />
    </div>
  );
}
