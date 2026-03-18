import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setMessage("All fields are required ❌");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post("/users/register", {
        name,
        email,
        password,
      });

      setMessage("Registration successful. You can login now ✅");
      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl w-[380px]"
      >
        <h2 className="text-3xl text-white font-bold text-center mb-6">
          Student Register
        </h2>

        {message && (
          <p className="text-center text-sm text-green-300 mb-4">{message}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 outline-none"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition disabled:opacity-70"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-white/70 mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-blue-300 hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}