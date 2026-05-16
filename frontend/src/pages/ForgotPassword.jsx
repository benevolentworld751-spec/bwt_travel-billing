import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios"; // Or your API helper

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // To this (replace 5000 with your backend port):
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email,
      });
      setMessage("Reset link sent! Please check your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <Link
          to="/login"
          className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </Link>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Forgot Password?
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                required
                className="w-full border border-gray-300 px-3 py-2 pl-10 rounded focus:outline-none focus:border-blue-500"
                placeholder="admin@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
