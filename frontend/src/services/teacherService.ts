import api from "./api"

// ================= TYPES =================

export interface EnrollStudentPayload {
  class_code: string
  student_badge: string
}

export interface StartSessionPayload {
  class_code: string
  latitude: number
  longitude: number
  radius_meters?: number
}

// ================= API CALLS =================

// ✅ Enroll Student
export const enrollStudent = async (payload: EnrollStudentPayload) => {
  const res = await api.post("/teacher/enroll-student", payload)
  return res.data
}

// ✅ Start Session (aligned with backend)
export const startSession = async (payload: StartSessionPayload) => {
  const res = await api.post("/teacher/start-session", null, {
    params: payload
  })
  return res.data
}

// ✅ End Session (uses session_id)
export const endSession = async (session_id: number) => {
  const res = await api.post("/teacher/end-session", null, {
    params: { session_id }
  })
  return res.data
}

// ✅ Teacher Profile
export const getMyProfile = async () => {
  const res = await api.get("/teacher/me")
  return res.data
}

// ✅ Get Active Session
export const getActiveSession = async () => {
  const res = await api.get("/teacher/active-session")
  return res.data
}

// ✅ Get Attendance For Session
export const getSessionAttendance = async (session_id: number) => {
  const res = await api.get(
    `/teacher/session-attendance/${session_id}`
  )
  return res.data
}
// ================= SESSION ANALYTICS =================

export const getSessionAnalytics = async (session_id: number) => {
  const res = await api.get(`/teacher/session-analytics/${session_id}`)
  return res.data
}

// ================= CLASS ANALYTICS =================

export const getClassAnalytics = async () => {
  const res = await api.get("/teacher/class-analytics")
  return res.data
}

export const exportAttendance = async (sessionId: number) => {
  const res = await api.get(`/teacher/export-attendance/${sessionId}`, {
    responseType: "blob"
  })

  return res.data
}
export const getSessionHistory = async () => {
  const res = await api.get("/teacher/session-history")
  return res.data
}