import axios from "axios";
import { useState, ChangeEvent, FormEvent } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import { useSelector } from "react-redux";

axios.defaults.withCredentials = true;

interface FormDataType {
    name: string;
    phoneNumber: string;
    password: string;
    userType: string;
}

export default function SignupPage() {
    const [formData, setFormData] = useState<FormDataType>({
        name: "",
        phoneNumber: "",
        password: "",
        userType: "",
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const authState = useSelector((state: any) => state.auth);
    console.log(authState)
    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { name, phoneNumber, password } = formData;
        const userType = "youth"; // Set default userType for signup
        if (!name || !phoneNumber || !password || !userType) {
            setLoading(false);
            toast.error("Please fill all fields including user type!");
            return;
        }

        const payload = { name, phoneNumber, password, userType };

        try {
            const res = await axios.post("/api/user/signup", payload, { withCredentials: true });
            toast.success(res?.data?.message || "Signed up successfully!");
        } catch (error: any) {
            console.log("Signup request error:", error);

            // Prefer backend message when available
            const backendMessage = error?.response?.data?.message;
            if (backendMessage) {
                toast.error(backendMessage);
            } else if (error?.message) {
                // Axios error or network error
                toast.error(error.message);
            } else {
                toast.error("Signup failed. Check console for details.");
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex justify-center min-h-screen px-4 mt-10">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 h-fit">
                <h1 className="text-3xl font-bold text-center mb-6">
                    Create Account
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Full Name */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 rounded-lg border focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="123 456 7890"
                            className="w-full px-4 py-3 rounded-lg border focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 pr-12 rounded-lg border focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-blue-400"
                    >
                        {loading ? "Creating Account…" : "Sign Up"}
                    </button>
                </form>

                <ToastContainer position="bottom-left" autoClose={3000} />
            </div>
        </div>
    );
}
