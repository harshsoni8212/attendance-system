import type { ReactNode } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

type Props = {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-xl font-bold text-blue-600 mb-8">
            Smart Attendance
          </h1>

          <nav className="space-y-4 text-slate-600">

            <button className="block hover:text-blue-500">
              Dashboard
            </button>

            {user?.role === "admin" && (
              <button className="block hover:text-blue-500">
                Manage Teachers
              </button>
            )}

            {user?.role === "teacher" && (
              <button className="block hover:text-blue-500">
                My Class
              </button>
            )}

            {user?.role === "student" && (
              <button className="block hover:text-blue-500">
                Attendance
              </button>
            )}

          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">

          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Welcome, {user?.name || user?.email}
            </h2>
            <p className="text-slate-500 capitalize">
              Role: {user?.role}
            </p>
          </div>

          <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg">
            {user?.class || "No Class Assigned"}
          </div>

        </div>

        {/* Page Content */}
        {children}

      </main>
    </div>
  )
}