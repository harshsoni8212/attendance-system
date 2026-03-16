import api from "./api";

// ================= CREATE TEACHER =================
export const createTeacher = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const res = await api.post("/admin/create-teacher", data);
  return res.data;
};

// ================= CREATE CLASS =================
export const createClass = async (data: { name: string }) => {
  const res = await api.post("/admin/create-class", data);
  return res.data;
};

// ================= GET TEACHERS =================
export const getTeachers = async () => {
  const res = await api.get("/admin/teachers");
  return res.data;
};

// ================= GET CLASSES =================
export const getClasses = async () => {
  const res = await api.get("/admin/classes");
  return res.data;
};

// ================= ASSIGN CLASS TO TEACHER =================
export const assignClassToTeacher = async (data: {
  teacher_badge: string;
  class_code: string;
}) => {
  const res = await api.post("/admin/assign-class", data);
  return res.data;
};