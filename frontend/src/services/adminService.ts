import axios from "axios"
import api from "./api"

const API = "http://127.0.0.1:8000"

export const createTeacher = async (data: {
  name: string
  email: string
  password: string
}) => {

  const token = localStorage.getItem("token")

  const response = await axios.post(
    `${API}/admin/create-teacher`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return response.data
}
export const createClass = async (data: {
  class_name: string
}) => {

  const token = localStorage.getItem("token")

  const response = await axios.post(
    `http://127.0.0.1:8000/admin/create-class`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return response.data
}

export const getTeachers = async () => {
  const res = await api.get("/admin/teachers")
  return res.data
}

export const assignClassToTeacher = async (data: {
  teacher_badge: string
  class_code: string
}) => {
  const res = await api.post("/admin/assign-class", data)
  return res.data
}