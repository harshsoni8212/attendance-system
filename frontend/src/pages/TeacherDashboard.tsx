import { useState, useEffect } from "react";
import {
  enrollStudent,
  startSession,
  endSession,
  getMyProfile,
  getActiveSession,
  getSessionAttendance,
  getSessionAnalytics,
  getClassAnalytics,
  exportAttendance,
  getSessionHistory,
} from "../services/teacherService";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [classAnalytics, setClassAnalytics] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  const [studentBadge, setStudentBadge] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/");
  };

  // ================= LOAD PROFILE =================
  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch {
      setMessage("Failed to load profile ❌");
    }
  };

  // ================= LOAD ACTIVE SESSION =================
  const loadActiveSession = async () => {
    try {
      const data = await getActiveSession();
      setActiveSession(data);
    } catch {
      setActiveSession(null);
    }
  };

  // ================= LOAD ATTENDANCE =================
  const loadAttendance = async (sessionId: number) => {
    try {
      const data = await getSessionAttendance(sessionId);
      setAttendanceList(data);
    } catch {
      console.log("Failed to load attendance");
    }
  };

  // ================= LOAD SESSION ANALYTICS =================
  const loadAnalytics = async (sessionId: number) => {
    try {
      const data = await getSessionAnalytics(sessionId);
      setAnalytics(data);
    } catch {
      console.log("Failed to load analytics");
    }
  };

  // ================= LOAD CLASS ANALYTICS =================
  const loadClassAnalytics = async () => {
    try {
      const data = await getClassAnalytics();
      setClassAnalytics(data);
    } catch {
      console.log("Failed to load class analytics");
    }
  };

  // ================= LOAD SESSION HISTORY =================
  const loadSessionHistory = async () => {
    try {
      const data = await getSessionHistory();
      setSessionHistory(data);
    } catch {
      console.log("Failed to load session history");
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    loadProfile();
    loadActiveSession();
    loadClassAnalytics();
    loadSessionHistory();
  }, []);

  // ================= LOAD SESSION DATA WHEN ACTIVE SESSION CHANGES =================
  useEffect(() => {
    if (!activeSession?.session_id) return;

    loadAttendance(activeSession.session_id);
    loadAnalytics(activeSession.session_id);
  }, [activeSession?.session_id]);

  // ================= LIVE POLLING / WEBSOCKET =================
  // ================= LIVE UPDATES (WEBSOCKET + FALLBACK POLLING) =================
  useEffect(() => {
    if (!activeSession?.session_id) return;

    const sessionId = activeSession.session_id;
    const wsBase = import.meta.env.VITE_API_WS || "ws://localhost:8000";
    const ws = new WebSocket(`${wsBase}/ws/attendance`);

    const refreshSessionData = async () => {
      try {
        await loadActiveSession();
        await loadAttendance(sessionId);
        await loadAnalytics(sessionId);
      } catch (err) {
        console.log("Live refresh failed", err);
      }
    };

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.event === "attendance_marked" &&
          data.session_id === sessionId
        ) {
          await refreshSessionData();
        }
      } catch {
        console.log("Invalid websocket message");
      }
    };

    ws.onerror = (err) => {
      console.log("WebSocket error", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    // Fallback polling every 5 sec (important for demo reliability)
    const interval = setInterval(async () => {
      await refreshSessionData();
    }, 5000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [activeSession?.session_id]);
  // ================= ENROLL STUDENT =================
  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.assigned_class_code) {
      setMessage("No class assigned ❌");
      return;
    }

    try {
      setLoading(true);

      await enrollStudent({
        class_code: profile.assigned_class_code,
        student_badge: studentBadge,
      });

      setMessage("Student enrolled successfully ✅");
      setStudentBadge("");
      await loadClassAnalytics();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Enrollment failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= START SESSION =================
  const handleStart = async () => {
    if (!profile?.assigned_class_code) {
      setMessage("No class assigned ❌");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          await startSession({
            class_code: profile.assigned_class_code,
            latitude,
            longitude,
            radius_meters: 20,
          });

          await loadActiveSession();
          await loadSessionHistory();
          await loadClassAnalytics();

          setMessage("Session Started 🚀");
        } catch (err: any) {
          setMessage(
            err.response?.data?.detail || "Failed to start session ❌",
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        setMessage("Location permission required ❌");
        setLoading(false);
      },
    );
  };

  // ================= END SESSION =================
  const handleEnd = async () => {
    if (!activeSession?.session_id) return;

    try {
      setLoading(true);

      await endSession(activeSession.session_id);

      setActiveSession(null);
      setAttendanceList([]);
      setAnalytics(null);

      await loadSessionHistory();
      await loadClassAnalytics();

      setMessage("Session Ended 🛑");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Failed to end session ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= CHART DATA =================
  const trendData = sessionHistory.map((s: any) => ({
    date: s.date ? new Date(s.date).toLocaleDateString() : "Unknown",
    present: s.present,
    absent: s.absent,
  }));

  const pieData = analytics
    ? [
        { name: "Present", value: analytics.present_students },
        { name: "Absent", value: analytics.absent_students },
      ]
    : [];

  const barData = classAnalytics.map((s: any) => ({
    name: s.student_name,
    attendance: s.attendance_percentage,
  }));

  // ================= DOWNLOAD CSV =================
  const handleDownload = async () => {
    if (!activeSession?.session_id) return;

    try {
      const blob = await exportAttendance(activeSession.session_id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_session_${activeSession.session_id}.csv`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch {
      setMessage("Failed to download CSV ❌");
    }
  };

  if (!profile) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black text-white p-10">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-400">Teacher Dashboard</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
          Logout
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5 mb-8 w-96 shadow-lg">
        <h2 className="text-xl font-bold text-blue-300 mb-2">{profile.name}</h2>

        <p className="text-sm text-gray-300 mb-3">{profile.email}</p>

        <div className="space-y-2 text-sm">
          <p>
            🎫 Badge:
            <span className="text-blue-300 ml-1">
              {profile.badge_number || "N/A"}
            </span>
          </p>

          <p>
            🏫 Assigned Class:
            <span className="text-green-300 ml-1">
              {profile.assigned_class || "Not Assigned"}
            </span>
          </p>

          <p>
            🔑 Class Code:
            <span className="text-yellow-300 ml-1">
              {profile.assigned_class_code || "Not Available"}
            </span>
          </p>

          <p>
            📡 Session:
            <span
              className={`ml-1 ${
                activeSession ? "text-green-400" : "text-red-400"
              }`}>
              {activeSession ? "Active" : "Inactive"}
            </span>
          </p>
        </div>
      </div>

      {/* ACTION SECTION */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* ENROLL STUDENT */}
        <form
          onSubmit={handleEnroll}
          className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-300 mb-3">
            Enroll Student
          </h2>

          <p className="text-sm text-gray-300 mb-3">
            Class Code:{" "}
            <span className="text-yellow-300">
              {profile.assigned_class_code || "Not Assigned"}
            </span>
          </p>

          <input
            placeholder="Student Badge ID"
            value={studentBadge}
            onChange={(e) => setStudentBadge(e.target.value)}
            className="w-full p-3 rounded bg-white/20 mb-4 outline-none"
            required
          />

          <button
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 py-2 rounded">
            Enroll Student
          </button>
        </form>

        {/* SESSION CONTROL */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-blue-300">
            Attendance Session
          </h2>

          <p className="text-sm text-gray-300">
            Using Class Code:{" "}
            <span className="text-yellow-300">
              {profile.assigned_class_code || "Not Assigned"}
            </span>
          </p>

          {!activeSession ? (
            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 py-2 rounded">
              Start Session
            </button>
          ) : (
            <button
              onClick={handleEnd}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 py-2 rounded">
              End Session
            </button>
          )}
        </div>
      </div>

      {/* LIVE ATTENDANCE */}
      {activeSession && (
        <div className="mt-8 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-300 mb-4">
            Live Attendance ({activeSession.class_name})
          </h2>

          {attendanceList.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No students marked attendance yet
            </p>
          ) : (
            <ul className="space-y-2">
              {attendanceList.map((student: any) => (
                <li
                  key={student.id}
                  className="flex justify-between bg-white/10 rounded p-2 text-sm">
                  <span>{student.student_name}</span>
                  <span className="text-green-400">Present</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* SESSION ANALYTICS */}
      {activeSession && analytics && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p>Total Students</p>
              <p className="text-2xl">{analytics.total_students}</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p>Present</p>
              <p className="text-2xl">{analytics.present_students}</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p>Absent</p>
              <p className="text-2xl">{analytics.absent_students}</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p>Attendance %</p>
              <p className="text-2xl">{analytics.attendance_rate}%</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="mt-4 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded">
            Download Attendance CSV
          </button>
        </div>
      )}

      {/* CLASS ANALYTICS */}
      {classAnalytics.length > 0 && (
        <div className="mt-6 bg-white/10 rounded-xl p-6 max-w-xl">
          <h2 className="text-lg font-semibold mb-4">
            Student Attendance Performance
          </h2>

          {classAnalytics.map((student: any) => {
            const percentage = student.attendance_percentage;

            const color =
              percentage >= 75
                ? "bg-green-400"
                : percentage >= 50
                  ? "bg-yellow-400"
                  : "bg-red-400";

            return (
              <div key={student.student_name} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{student.student_name}</span>
                  <span>{percentage}%</span>
                </div>

                <div className="w-full bg-gray-700 rounded h-2">
                  <div
                    className={`${color} h-2 rounded`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SESSION HISTORY */}
      {sessionHistory.length > 0 && (
        <div className="mt-8 bg-white/10 rounded-xl p-6 max-w-xl">
          <h2 className="text-lg font-semibold mb-4">Session History</h2>

          <div className="space-y-2">
            {sessionHistory.map((session: any) => {
              const date = session.date
                ? new Date(session.date).toLocaleDateString()
                : "Unknown";

              return (
                <div
                  key={session.session_id}
                  className="flex justify-between bg-white/10 p-3 rounded text-sm">
                  <span>{date}</span>
                  <span className="text-green-400">
                    Present: {session.present}
                  </span>
                  <span className="text-red-400">Absent: {session.absent}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ATTENDANCE TREND */}
      {trendData.length > 0 && (
        <div className="mt-10 bg-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Attendance Trend</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="present" stroke="#22c55e" />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ATTENDANCE DISTRIBUTION */}
      {analytics && (
        <div className="mt-10 bg-white/10 rounded-xl p-6 max-w-xl">
          <h2 className="text-lg font-semibold mb-4">
            Attendance Distribution
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* STUDENT PERFORMANCE */}
      {barData.length > 0 && (
        <div className="mt-10 bg-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Student Performance</h2>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attendance" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {message && (
        <div className="mt-6 bg-blue-500/20 border border-blue-400 px-4 py-2 rounded">
          {message}
        </div>
      )}
    </div>
  );
}
