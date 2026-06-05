import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Calendar, CheckCircle2, UserPlus, Heart, Search, ClipboardList, Check, AlertCircle, X, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import API from "@/components/apiClient";
import { getSocket } from "@/lib/socket";
import "react-toastify/dist/ReactToastify.css";

interface Customer {
  _id: string;
  name: string;
  phoneNumber: string;
}

interface EventInvite {
  _id: string;
  customerId: Customer | null;
  status: string;
  response: string;
  callingBy: string;
  attended: boolean;
}

interface Program {
  _id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  invitedCustomers: EventInvite[];
}

export default function AttendanceManager() {
  const auth = useSelector((s: any) => s.auth);
  const currentUser = auth?.user;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [latestEvent, setLatestEvent] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Accordion status (one open at one time)
  const [activeAccordion, setActiveAccordion] = useState<"invited" | "checkedIn">("invited");

  // In-memory queue system for adding attendees before API submissions
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [queuedAttendees, setQueuedAttendees] = useState<{ name: string; phoneNumber: string }[]>([]);
  const [queueName, setQueueName] = useState("");
  const [queuePhone, setQueuePhone] = useState("");

  const fetchEventsAndAttendance = async () => {
    try {
      const res = await API.getPrograms();
      const list: Program[] = res.data.data || [];
      setPrograms(list);
      
      if (list.length > 0) {
        // Find latest event based on date (descending)
        const sorted = [...list].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setLatestEvent(sorted[0]);
      } else {
        setLatestEvent(null);
      }
    } catch (err) {
      toast.error("Failed to load attendance information");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEventsAndAttendance().finally(() => {
      setLoading(false);
    });
  }, []);

  // WebSockets sync for real-time check-ins
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const handleUpdate = () => {
      fetchEventsAndAttendance();
    };

    socket.on("attendance-update", handleUpdate);
    socket.on("customer-update", handleUpdate);

    return () => {
      socket.off("attendance-update", handleUpdate);
      socket.off("customer-update", handleUpdate);
    };
  }, []);

  const handleToggleAttendance = async (inviteId: string, currentStatus: boolean) => {
    if (!latestEvent) return;

    try {
      // Create updated invitedCustomers list
      const updatedInvites = latestEvent.invitedCustomers.map((ic) => {
        const idToCheck = ic.customerId?._id || (ic as any).customerId;
        const targetId = ic._id;
        
        if (targetId === inviteId) {
          return {
            ...ic,
            customerId: idToCheck,
            attended: !currentStatus,
          };
        }
        return {
          ...ic,
          customerId: idToCheck,
        };
      });

      await API.updateProgram({
        id: latestEvent._id,
        invitedCustomers: updatedInvites,
      });

      // Broadcast changes
      const socket = getSocket();
      socket.emit("attendance-update", { eventId: latestEvent._id });

      toast.success(currentStatus ? "Check-in removed" : "Checked in successfully!");
      fetchEventsAndAttendance();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update attendance.");
    }
  };

  // In-memory queue operations
  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueName || !queuePhone) {
      return toast.error("Please enter a name and phone number");
    }
    
    // Check if already in queue
    if (queuedAttendees.find((a) => a.phoneNumber === queuePhone)) {
      return toast.error("This phone number is already added to the list");
    }

    setQueuedAttendees([...queuedAttendees, { name: queueName, phoneNumber: queuePhone }]);
    setQueueName("");
    setQueuePhone("");
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueuedAttendees(queuedAttendees.filter((_, idx) => idx !== index));
  };

  const handleSubmitAllAttendees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestEvent) return;

    if (queuedAttendees.length === 0) {
      return toast.error("Add at least one attendee to the list first");
    }

    setAddLoading(true);
    try {
      const addedCustomerIDs: string[] = [];
      const addedNames: string[] = [];

      // 1. Process all profiles creation
      for (const attendee of queuedAttendees) {
        const customerRes = await API.addCustomer({
          name: attendee.name,
          phoneNumber: attendee.phoneNumber,
          userType: "youth",
          adderId: currentUser?.id || "Admin",
        });

        const newCustomer = customerRes.data.data || customerRes.data;
        const newCustomerId = newCustomer?._id || newCustomer?.id || customerRes.data?.customer?._id;

        if (newCustomerId) {
          addedCustomerIDs.push(newCustomerId.toString());
          addedNames.push(attendee.name);
        } else {
          // Fallback search
          const listRes = await API.getAllCustomers();
          const found = (listRes.data.data || []).find((c: any) => c.phoneNumber.toString() === attendee.phoneNumber.toString());
          if (found) {
            addedCustomerIDs.push(found._id.toString());
            addedNames.push(attendee.name);
          }
        }
      }

      if (addedCustomerIDs.length === 0) {
        throw new Error("Failed to register new attendee profiles");
      }

      // 2. Prepare the updated invited list (single program update)
      const baseInvites = latestEvent.invitedCustomers.map((ic: any) => ({
        ...ic,
        customerId: ic.customerId?._id || ic.customerId,
      }));

      let updatedInvites = [...baseInvites];

      for (let i = 0; i < addedCustomerIDs.length; i++) {
        const customerId = addedCustomerIDs[i];
        
        const alreadyInvitedIdx = updatedInvites.findIndex(
          (ic: any) => {
            const cid = ic.customerId?._id || ic.customerId;
            return cid?.toString() === customerId;
          }
        );

        if (alreadyInvitedIdx > -1) {
          updatedInvites[alreadyInvitedIdx] = {
            ...updatedInvites[alreadyInvitedIdx],
            attended: true,
          };
        } else {
          updatedInvites.push({
            customerId,
            status: "called",
            response: "comes to youth class",
            callingBy: currentUser?.name || "Admin",
            attended: true,
          });
        }
      }

      // Submit update all at once
      await API.updateProgram({
        id: latestEvent._id,
        invitedCustomers: updatedInvites,
      });

      // 3. Socket emits
      const socket = getSocket();
      socket.emit("attendance-update", { eventId: latestEvent._id });
      addedCustomerIDs.forEach((cid) => {
        socket.emit("customer-update", { customerId: cid });
      });

      // Broadcast logs alert
      socket.emit("new-notification", {
        type: "new-youth",
        message: `Registered & checked in ${addedNames.length} new attendee(s)`,
        createdAt: new Date(),
      });

      toast.success(`Successfully registered and checked in ${addedNames.length} attendee(s)!`);
      setQueuedAttendees([]);
      setShowAddForm(false);
      fetchEventsAndAttendance();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit attendance check-ins.");
    } finally {
      setAddLoading(false);
    }
  };

  const toggleAccordion = (tab: "invited" | "checkedIn") => {
    setActiveAccordion(activeAccordion === tab ? (tab === "invited" ? "checkedIn" : "invited") : tab);
  };

  // Filter lists based on search query
  const filteredInvites = latestEvent?.invitedCustomers.filter((ic) =>
    ic.customerId?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const attendedList = filteredInvites.filter((ic) => ic.attended);
  const invitedPendingList = filteredInvites.filter((ic) => !ic.attended);

  return (
    <div className="p-5 sm:p-6 space-y-6 pb-12">
      <div className="animate-fadeIn space-y-6">
        {/* HEADER SECTION */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-zinc-800/80">
        <div>
          <h1 className="text-lg font-bold text-neutral-800 dark:text-zinc-100 font-display uppercase tracking-tight">Attendance Check-in</h1>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">Mark attendance and register new attendees</p>
        </div>
        {latestEvent && (
          <button
            onClick={() => {
              setQueuedAttendees([]);
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-100"
          >
            <UserPlus size={16} /> Add Attendee
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      ) : !latestEvent ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-100 dark:border-zinc-800/80 shadow-premium">
          <ClipboardList size={40} className="mx-auto mb-3 text-neutral-300 dark:text-zinc-700" />
          <p className="text-xs text-neutral-500 dark:text-zinc-400 font-semibold">No active events found</p>
          <p className="text-[10px] text-neutral-400 dark:text-zinc-550 mt-1 max-w-[220px] mx-auto leading-relaxed">
            Please schedule a class or program inside the Event Manager before checking in attendees.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* LATEST EVENT DETAILS STRIP */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800/80 shadow-premium rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                Latest Event Date
              </span>
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-zinc-100 mt-1.5">{latestEvent.title}</h2>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 font-sans mt-0.5 flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(latestEvent.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            
            <div className="flex gap-4 text-xs font-semibold text-neutral-600 dark:text-zinc-400 font-sans sm:self-center">
              <div className="text-center bg-neutral-50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-neutral-100 dark:border-zinc-800/40">
                <p className="text-neutral-400 dark:text-zinc-550 text-[9px] uppercase tracking-wider">Invited</p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{latestEvent.invitedCustomers.length}</p>
              </div>
              <div className="text-center bg-neutral-50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-neutral-100 dark:border-zinc-800/40">
                <p className="text-neutral-400 dark:text-zinc-550 text-[9px] uppercase tracking-wider">Attended</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {latestEvent.invitedCustomers.filter(c => c.attended).length}
                </p>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-550">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search attendee by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full premium-input pl-9 text-xs py-2.5"
            />
          </div>

          {/* ACCORDION SYSTEM (ONE OPEN AT A TIME) */}
          <div className="space-y-4">
            {/* Accordion 1: Invited List */}
            <div className="border border-neutral-100 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-premium">
              <button
                onClick={() => toggleAccordion("invited")}
                className={`w-full p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-left transition-colors border-b ${
                  activeAccordion === "invited" 
                    ? "bg-indigo-50/20 dark:bg-indigo-950/15 border-indigo-100/50 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400" 
                    : "border-transparent text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50/50 dark:hover:bg-zinc-800/20"
                }`}
                type="button"
              >
                <span>Invited List ({invitedPendingList.length})</span>
                <span className="text-[10px]">{activeAccordion === "invited" ? "▼" : "▶"}</span>
              </button>

              {activeAccordion === "invited" && (
                <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto scrollable-content animate-fadeIn bg-neutral-50/10 dark:bg-transparent">
                  {invitedPendingList.length === 0 ? (
                    <p className="text-xs text-neutral-400 dark:text-zinc-550 italic py-6 text-center">No pending invitees.</p>
                  ) : (
                    invitedPendingList.map((ic) => {
                      const c = ic.customerId;
                      if (!c) return null;
                      return (
                        <div
                          key={ic._id}
                          onClick={() => handleToggleAttendance(ic._id, false)}
                          className="p-3.5 bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800/80 rounded-xl flex justify-between items-center cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-neutral-50/20 dark:hover:bg-zinc-800/20 transition group"
                        >
                          <div>
                            <p className="font-semibold text-neutral-800 dark:text-zinc-100 text-xs">{c.name}</p>
                            <p className="text-[10px] text-neutral-400 dark:text-zinc-500 font-sans mt-0.5">{c.phoneNumber}</p>
                          </div>
                          
                          <div className="w-6 h-6 rounded-lg border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-neutral-300 dark:text-zinc-650 group-hover:border-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/20 dark:group-hover:border-indigo-800 transition">
                            <Check size={12} className="opacity-0 group-hover:opacity-100 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Accordion 2: Checked In List */}
            <div className="border border-neutral-100 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-premium">
              <button
                onClick={() => toggleAccordion("checkedIn")}
                className={`w-full p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-left transition-colors border-b ${
                  activeAccordion === "checkedIn" 
                    ? "bg-emerald-50/20 dark:bg-emerald-950/15 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                    : "border-transparent text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50/50 dark:hover:bg-zinc-800/20"
                }`}
                type="button"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Checked In ({attendedList.length})</span>
                </span>
                <span className="text-[10px]">{activeAccordion === "checkedIn" ? "▼" : "▶"}</span>
              </button>

              {activeAccordion === "checkedIn" && (
                <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto scrollable-content animate-fadeIn bg-neutral-50/10 dark:bg-transparent">
                  {attendedList.length === 0 ? (
                    <p className="text-xs text-neutral-400 dark:text-zinc-555 italic py-6 text-center">No attendees checked in yet.</p>
                  ) : (
                    attendedList.map((ic) => {
                      const c = ic.customerId;
                      if (!c) return null;
                      return (
                        <div
                          key={ic._id}
                          onClick={() => handleToggleAttendance(ic._id, true)}
                          className="p-3.5 bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800/80 rounded-xl flex justify-between items-center cursor-pointer hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-neutral-50/20 dark:hover:bg-zinc-800/20 transition group"
                        >
                          <div>
                            <p className="font-semibold text-neutral-800 dark:text-zinc-100 text-xs">{c.name}</p>
                            <p className="text-[10px] text-neutral-400 dark:text-zinc-500 font-sans mt-0.5">{c.phoneNumber}</p>
                          </div>
                          
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-650 dark:text-emerald-400 transition group-hover:bg-rose-50 dark:group-hover:bg-rose-950/20 group-hover:border-rose-200 dark:group-hover:border-rose-800 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            <Check size={12} className="group-hover:hidden" />
                            <X size={12} className="hidden group-hover:block" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* BATCH ADD ATTENDEE MODAL */}
      {showAddForm && latestEvent && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-md z-50 p-4"
          onClick={() => {
            setQueuedAttendees([]);
            setShowAddForm(false);
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800/80 w-full max-w-md p-6 rounded-2xl shadow-xl overflow-hidden animate-slideUp space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-zinc-800/80">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800 dark:text-zinc-100">Add New Attendees</h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">Register new profiles and check them in</p>
              </div>
            </div>

            {/* Sub-form to Add single attendee to queue list */}
            <form onSubmit={handleAddToQueue} className="bg-neutral-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-neutral-100/50 dark:border-zinc-800/40 space-y-3.5">
              <span className="text-[9px] uppercase font-bold text-indigo-650 dark:text-indigo-455">
                New Attendee Entry
              </span>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 dark:text-zinc-450 uppercase tracking-wider mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={queueName}
                    onChange={(e) => setQueueName(e.target.value)}
                    className="w-full premium-input py-2 text-xs"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 dark:text-zinc-455 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={queuePhone}
                    onChange={(e) => setQueuePhone(e.target.value)}
                    className="w-full premium-input py-2 text-xs"
                    placeholder="9988776655"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-neutral-150 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-750 text-neutral-800 dark:text-zinc-200 border border-neutral-250 dark:border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-98"
              >
                + Add to List
              </button>
            </form>

            {/* In-memory Queue List display */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-neutral-450 dark:text-zinc-500 tracking-wider">
                  List to Check In ({queuedAttendees.length})
                </span>
                {queuedAttendees.length > 0 && (
                  <button
                    onClick={() => setQueuedAttendees([])}
                    className="text-[9px] font-bold text-rose-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="border border-neutral-100 dark:border-zinc-800/80 rounded-xl max-h-[130px] overflow-y-auto scrollable-content p-2 bg-neutral-50/50 dark:bg-zinc-950/40 space-y-1">
                {queuedAttendees.length === 0 ? (
                  <p className="text-[10px] text-neutral-400 dark:text-zinc-550 italic text-center py-5">
                    No attendees added yet. Fill form and click '+ Add to List'.
                  </p>
                ) : (
                  queuedAttendees.map((attendee, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-lg flex justify-between items-center text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-neutral-800 dark:text-zinc-150 truncate">{attendee.name}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-zinc-500 font-sans">{attendee.phoneNumber}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(idx)}
                        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 rounded transition active:scale-90"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Submit all CTA */}
            <div className="flex gap-2 border-t border-neutral-100 dark:border-zinc-800/80 pt-4 mt-4">
              <button
                type="button"
                disabled={addLoading || queuedAttendees.length === 0}
                onClick={handleSubmitAllAttendees}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-50/50 disabled:bg-neutral-100 disabled:text-neutral-450 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650"
              >
                {addLoading ? "Saving all..." : "Save Checked-In Attendees"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQueuedAttendees([]);
                  setShowAddForm(false);
                }}
                className="flex-1 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center py-4 shrink-0 mt-8">
        <p className="text-[10px] text-neutral-400 dark:text-zinc-550 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
          Made with <Heart size={10} className="fill-rose-400 stroke-rose-400" /> for community followups
        </p>
      </div>

      <ToastContainer position="bottom-left" autoClose={3000} />
    </div>
  );
}
