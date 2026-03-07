import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

import {
  markAttendance,
  enrollFace,
  getActiveSession,
  getMyProfile,
  getMyAttendanceHistory,
  getMyAnalytics,
} from "../services/studentService";

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
} from "recharts";

import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const webcamRef = useRef<Webcam>(null);

  const [activeSession, setActiveSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successPulse, setSuccessPulse] = useState(false);

  const navigate = useNavigate();

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  // ================= LOAD SESSION =================
  const loadSession = async () => {
    try {
      const res = await getActiveSession();
      setActiveSession(res);
    } catch {
      setActiveSession(null);
    }
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

  // ================= LOAD HISTORY =================
  const loadHistory = async () => {
    try {
      const data = await getMyAttendanceHistory();
      setHistory(data);
    } catch {
      console.log("Failed to load history");
    }
  };

  // ================= LOAD ANALYTICS =================
  const loadAnalytics = async () => {
    try {
      const data = await getMyAnalytics();
      setAnalytics(data);
    } catch {
      console.log("Failed to load analytics");
    }
  };

  useEffect(() => {
    loadSession();
    loadProfile();
    loadHistory();
    loadAnalytics();

    const interval = setInterval(loadSession, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= ENROLL FACE =================
  const enrollMyFace = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      setMessage("Camera capture failed ❌");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const blob = await fetch(imageSrc).then((res) => res.blob());
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });

      await enrollFace(file);

      setMessage("Face enrolled successfully ✅");
      loadProfile();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Enrollment failed ❌");
    }

    setLoading(false);
  };

  // ================= MARK ATTENDANCE =================
  const captureAndMark = async () => {
    if (!activeSession?.id) {
      setMessage("No active session ❌");
      return;
    }

    setLoading(true);
    setMessage("");

    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      setMessage("Camera capture failed ❌");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const blob = await fetch(imageSrc).then((res) => res.blob());
          const file = new File([blob], "attendance.jpg", {
            type: "image/jpeg",
          });

          await markAttendance({
            session_id: activeSession.id,
            latitude,
            longitude,
            file,
          });

          setSuccessPulse(true);
          setMessage("Attendance Marked Successfully");

          setTimeout(() => {
            setSuccessPulse(false);
          }, 2500);

          loadHistory();
          loadAnalytics();
        } catch (err: any) {
          setMessage(err.response?.data?.detail || "Failed ❌");
        }

        setLoading(false);
      },
      () => {
        setMessage("Location permission required ❌");
        setLoading(false);
      },
    );
  };

  // ================= CHART DATA =================

  const trendData = history.map((h: any) => ({
    date: h.timestamp ? new Date(h.timestamp).toLocaleDateString() : "Unknown",
    present: h.status === "Present" ? 1 : 0,
  }));

  const pieData = analytics
    ? [
        { name: "Present", value: analytics.present },
        { name: "Absent", value: analytics.absent },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-gradient-to-br from-blue-900 to-black text-white">
      <h1 className="text-3xl text-blue-400 mb-4">Student Dashboard</h1>

      {/* PROFILE CARD */}
      {profile && (
        <div
          className={`rounded-xl p-5 mb-6 w-80 text-center backdrop-blur-lg border transition-all duration-500
          ${
            profile.face_enrolled
              ? "bg-green-500/10 border-green-400 shadow-[0_0_25px_rgba(34,197,94,0.6)]"
              : "bg-red-500/10 border-red-400"
          }
        `}>
          <h2 className="text-lg font-bold text-blue-300">{profile.name}</h2>

          <p className="text-sm text-gray-300">{profile.email}</p>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              🎫 Badge:
              <span className="text-blue-300 ml-1">{profile.badge_number}</span>
            </p>

            <p>
              🏫 Class:
              <span className="text-green-300 ml-1">
                {profile.assigned_class || "Not Assigned"}
              </span>
            </p>

            <p>
              😊 Face:
              <span
                className={`ml-2 px-2 py-1 rounded text-xs
                ${
                  profile.face_enrolled
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }
              `}>
                {profile.face_enrolled ? "Enrolled" : "Not Enrolled"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {analytics && (
        <div className="grid grid-cols-2 gap-4 mb-6 w-80">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p>Total Classes</p>
            <p className="text-2xl">{analytics.total_classes}</p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p>Present</p>
            <p className="text-2xl text-green-400">{analytics.present}</p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p>Absent</p>
            <p className="text-2xl text-red-400">{analytics.absent}</p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p>Attendance %</p>
            <p className="text-2xl text-yellow-300">
              {analytics.attendance_percentage}%
            </p>
          </div>
        </div>
      )}

      {/* SESSION STATUS */}
      {activeSession ? (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">
          Active Session: {activeSession.class_name}
        </div>
      ) : (
        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded mb-4">
          No Active Session
        </div>
      )}

      {/* CAMERA */}

      <p className="text-sm text-gray-300 mb-2">
        Position your face inside the frame
      </p>

      <div className="relative mb-4">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="rounded-xl shadow-lg"
        />

        {/* FACE GUIDE FRAME */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-56 h-56 border-4 border-green-400 rounded-xl pointer-events-none animate-pulse" />
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={enrollMyFace}
          disabled={loading}
          className="bg-white text-blue-900 px-6 py-2 rounded">
          {loading ? "Processing..." : "Enroll Face"}
        </button>

        <button
          onClick={captureAndMark}
          disabled={loading || !activeSession}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded">
          {loading ? "Processing..." : "Mark Attendance"}
        </button>
      </div>
      {/* ATTENDANCE TREND */}
      {trendData.length > 0 && (
        <div className="w-full max-w-2xl bg-white/10 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-semibold mb-4">Attendance Trend</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />

              <Line type="monotone" dataKey="present" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ATTENDANCE PIE */}
      {analytics && (
        <div className="bg-white/10 rounded-xl p-6 mb-10">
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

      {/* HISTORY */}

      <div className="w-full max-w-md">
        <h2 className="text-lg font-semibold mb-3 text-blue-300">
          Attendance History
        </h2>

        {history.length === 0 ? (
          <p className="text-gray-400">No records yet</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h: any) => (
              <li
                key={h.id}
                className="bg-white/10 rounded p-2 flex justify-between">
                <span>{new Date(h.timestamp).toLocaleDateString()}</span>

                <span className="text-green-400">{h.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {successPulse && (
        <div className="mt-6 bg-green-500/20 border border-green-400 px-6 py-3 rounded-xl animate-bounce">
          🎉 Attendance Marked Successfully
        </div>
      )}

      {!successPulse && message && (
        <p className="mt-4 text-gray-300">{message}</p>
      )}

      <button
        onClick={handleLogout}
        className="absolute top-5 right-5 bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
}
