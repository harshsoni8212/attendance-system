import { useState, useEffect } from "react"
import { createTeacher, createClass, getTeachers, assignClassToTeacher } from "../services/adminService"
import { useNavigate } from "react-router-dom"

export default function AdminDashboard() {

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [className, setClassName] = useState("")
  const [teachers, setTeachers] = useState<any[]>([])
  const [teacherBadge, setTeacherBadge] = useState("")
  const [assignClassCode, setAssignClassCode] = useState("")
  const [message, setMessage] = useState("")

  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    navigate("/")
  }

  // ================= FETCH TEACHERS =================
  const loadTeachers = async () => {
    try {
      const data = await getTeachers()
      setTeachers(data)
    } catch {
      setMessage("Failed to load teachers ❌")
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [])

  // ================= CREATE TEACHER =================
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createTeacher({ name, email, password })
      setMessage("Teacher created ✅")
      loadTeachers()
    } catch (err:any) {
      setMessage(err.response?.data?.detail || "Error ❌")
    }
  }

  // ================= CREATE CLASS =================
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createClass({ class_name: className })
      setMessage("Class created 🏫")
    } catch (err:any) {
      setMessage(err.response?.data?.detail || "Error ❌")
    }
  }

  // ================= ASSIGN CLASS =================
  const handleAssignClass = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await assignClassToTeacher({
        teacher_badge: teacherBadge,
        class_code: assignClassCode
      })
      setMessage("Class assigned to teacher ✅")
    } catch (err:any) {
      setMessage(err.response?.data?.detail || "Assignment failed ❌")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-10">

      <h1 className="text-4xl font-bold text-blue-700 mb-10">
        Admin Control Panel
      </h1>

      {/* ===== CREATE SECTION ===== */}
      <div className="grid md:grid-cols-2 gap-8 mb-10">

        {/* CREATE TEACHER */}
        <form onSubmit={handleCreateTeacher} className="bg-white shadow-xl p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Create Teacher</h2>

          <input placeholder="Name" value={name}
            onChange={(e)=>setName(e.target.value)}
            className="w-full p-3 border rounded mb-3" />

          <input placeholder="Email" value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full p-3 border rounded mb-3" />

          <input type="password" placeholder="Password" value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full p-3 border rounded mb-3" />

          <button className="bg-blue-600 text-white w-full py-2 rounded">
            Create Teacher
          </button>
        </form>

        {/* CREATE CLASS */}
        <form onSubmit={handleCreateClass} className="bg-white shadow-xl p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Create Class</h2>

          <input placeholder="Class Name"
            value={className}
            onChange={(e)=>setClassName(e.target.value)}
            className="w-full p-3 border rounded mb-3" />

          <button className="bg-blue-600 text-white w-full py-2 rounded">
            Create Class
          </button>
        </form>

      </div>

      {/* ===== ASSIGN CLASS ===== */}
      <div className="bg-white shadow-xl p-6 rounded-2xl mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Assign Class to Teacher
        </h2>

        <form onSubmit={handleAssignClass}>
          <input
            placeholder="Teacher Badge"
            value={teacherBadge}
            onChange={(e)=>setTeacherBadge(e.target.value)}
            className="w-full p-3 border rounded mb-3"
          />

          <input
            placeholder="Class Code"
            value={assignClassCode}
            onChange={(e)=>setAssignClassCode(e.target.value)}
            className="w-full p-3 border rounded mb-3"
          />

          <button className="bg-blue-600 text-white w-full py-2 rounded">
            Assign Class
          </button>
        </form>
      </div>

      {/* ===== TEACHER LIST ===== */}
      <div className="bg-white shadow-xl rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Teacher Staff</h2>

        {teachers.length === 0 ? (
          <p>No teachers yet</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th>Name</th>
                <th>Email</th>
                <th>Badge</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t:any) => (
                <tr key={t.id} className="border-b">
                  <td>{t.name}</td>
                  <td>{t.email}</td>
                  <td>{t.badge_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {message && (
        <div className="mt-6 bg-blue-100 text-blue-700 px-6 py-3 rounded">
          {message}
        </div>
      )}

      <button
        onClick={handleLogout}
        className="absolute top-5 right-5 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>

    </div>
  )
}