import api from "./api"

// ============================
// TYPES
// ============================

export interface MarkAttendancePayload {
  session_id: number
  latitude: number
  longitude: number
  file: File
}

// ============================
// ENROLL FACE
// ============================

export const enrollFace = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  const res = await api.post("/users/enroll-face", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })

  return res.data
}

// ============================
// MARK ATTENDANCE (SESSION ID BASED)
// ============================

export const markAttendance = async ({
  session_id,
  latitude,
  longitude,
  file
}: MarkAttendancePayload) => {

  const formData = new FormData()

  formData.append("session_id", String(session_id))
  formData.append("latitude", String(latitude))
  formData.append("longitude", String(longitude))
  formData.append("file", file)

  const res = await api.post("/attendance/mark", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })

  return res.data
}

// ============================
// GET ACTIVE SESSION
// ============================

export const getActiveSession = async () => {
  const res = await api.get("/attendance/active-session")
  return res.data
}

// ============================
// STUDENT PROFILE
// ============================

export const getMyProfile = async () => {
  const res = await api.get("/student/me")
  return res.data
}

// ============================
// ATTENDANCE HISTORY
// ============================

export const getMyAttendanceHistory = async () => {
  const res = await api.get("/attendance/my-history")
  return res.data
}

// ============================
// STUDENT ANALYTICS
// ============================
export const getMyAnalytics = async () => {
  const res = await api.get("/attendance/my-analytics")
  return res.data
}