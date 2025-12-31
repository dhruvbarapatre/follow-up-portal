import axios from "axios";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Phone, X, Users, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { PersistData } from "@/components/my-list-com/types";

axios.defaults.withCredentials = true;

interface Admin {
  name: string;
  phone: string;
}

interface FormData {
  phoneNumber: string;
  password: string;
  userType: string; // <-- Added
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: "",
    password: "",
    userType: "", // <-- Added
  });

  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useRouter();
  const auth = useSelector((s: PersistData) => s.auth);

  // Fetch admin contacts
  useEffect(() => {
    if (showPopup && admins.length === 0) {
      const fetchAdmins = async () => {
        setAdminLoading(true);
        try {
          const res = await axios.get("/api/get-admins");
          setAdmins(res.data.data || []);
        } catch (error) {
          toast.error("Failed to load admin contacts");
        } finally {
          setAdminLoading(false);
        }
      };
      fetchAdmins();
    }
  }, [showPopup, admins.length]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { phoneNumber, password } = formData;
    
    const userType = auth.user.userType; 
    if (!phoneNumber || !password || !userType) {
      toast.error("Please fill all fields including user type!");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/user/login", {
        phoneNumber,
        password,
        userType,
      });

      localStorage.setItem("fyp_token", res.data.token);
      toast.success(res.data.message);

      setTimeout(() => navigate.push("/"), 1500);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center w-full py-10">
        <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-gray-500">Login to your account</p>
          </div>


          {/* PHONE NUMBER */}
          <div className="mb-4">
            <label className="block mb-1 font-medium" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="123 456 7890"
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-5">
            <label className="block mb-1 font-medium" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-lg pr-12 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 rounded-lg transition disabled:bg-blue-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Register Info */}
          <p className="text-center text-gray-500 mt-4">
            Don't have an account?
            <br />
            Contact{" "}
            <span
              className="text-blue-600 font-medium underline cursor-pointer"
              onClick={() => setShowPopup(true)}
            >
              Admin
            </span>{" "}
            to Create.
          </p>
        </div>
      </div>

      {/* POPUP MODAL */}
      {showPopup && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-600 p-5 text-white relative">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute right-4 top-4 bg-white/20 p-2 rounded-full"
              >
                <X size={18} />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users size={32} />
                </div>
                <h3 className="text-xl font-bold">Contact Admin</h3>
                <p className="text-white/80 text-sm">
                  Reach out to create your account
                </p>
              </div>
            </div>

            <div className="p-5">
              {adminLoading ? (
                <div className="text-center py-4">
                  <p>Loading admin contacts...</p>
                </div>
              ) : admins.length > 0 ? (
                admins.map((admin, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-100 border rounded-lg p-4 mb-3 flex justify-between items-center hover:bg-gray-200 transition"
                  >
                    <div>
                      <p className="font-semibold">{admin.name}</p>
                      <p className="text-gray-600 flex items-center gap-1 text-sm">
                        <Phone size={14} /> {admin.phone}
                      </p>
                    </div>
                    <a
                      href={`tel:${admin.phone}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm"
                    >
                      <Phone size={16} /> Call
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No admin contacts found</p>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-left" autoClose={3000} />
    </>
  );
}
