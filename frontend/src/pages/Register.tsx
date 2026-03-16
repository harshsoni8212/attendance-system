import { useState } from "react"
import { motion } from "framer-motion"
import api from "../services/api"

export default function Register() {

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [message,setMessage] = useState("")

  const handleRegister = async (e:any)=>{
  e.preventDefault()

  try{
    await api.post("/auth/register-student",{
      name,
      email,
      password
    })

    setMessage("Registration successful. You can login now.")
    setName("")
    setEmail("")
    setPassword("")
  }
  catch(err:any){
    setMessage(err.response?.data?.detail || "Registration failed")
  }
}

  return(
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">

      <motion.div
        initial={{opacity:0,y:40}}
        animate={{opacity:1,y:0}}
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
            placeholder="Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/20 text-white"
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/20 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/20 text-white"
          />

          <button className="w-full bg-blue-500 text-white p-3 rounded-xl">
            Register
          </button>

        </form>

      </motion.div>
    </div>
  )
}