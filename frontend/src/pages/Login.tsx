import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../context/AuthContext"

export default function Login() {

  const navigate = useNavigate()
  const { login, user } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 🚀 AUTO REDIRECT if already logged in
  useEffect(() => {
    if (user?.role === "admin") navigate("/admin")
    else if (user?.role === "teacher") navigate("/teacher")
    else if (user?.role === "student") navigate("/student")
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await axios.post("http://127.0.0.1:8000/auth/login", {
        email,
        password
      })

      const token = res.data.access_token

      // 🔐 Save globally via AuthContext
      login({
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        class: res.data.class,
        badge_id: res.data.badge_id
      }, token)

      // ❌ NO MANUAL NAVIGATION HERE NOW

    } catch (err:any) {
      setError(err.response?.data?.detail || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">

    <div className="absolute w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
    <div className="absolute w-96 h-96 bg-indigo-500 opacity-20 rounded-full blur-3xl bottom-10 right-10 animate-pulse"></div>

    <motion.div
      initial={{ opacity:0, y:40 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.5 }}
      className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-10 rounded-3xl w-[380px]"
    >

      <h2 className="text-3xl font-bold text-white text-center mb-2">
        Smart Attendance
      </h2>

      <p className="text-center text-white/60 mb-6">
        Secure AI Presence System
      </p>

      {error && (
        <p className="text-red-300 text-sm text-center mb-3">{error}</p>
      )}

      <form onSubmit={handleLogin} className="space-y-4">

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-blue-400 transition"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-blue-400 transition"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <motion.button
          whileHover={{ scale:1.05 }}
          whileTap={{ scale:0.95 }}
          disabled={loading}
          className="w-full bg-blue-500 text-white font-semibold p-3 rounded-xl shadow-lg hover:bg-blue-600 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </motion.button>

      </form>

    </motion.div>
  </div>
)
}