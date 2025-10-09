import axiosInstance from './axiosInstance';

// List students in user's school
export async function fetchStudents() {
  const res = await axiosInstance.get('/students/all/');
  return res.data;
}

// Add new student
export async function addStudent(data) {
  const res = await axiosInstance.post('/students/add/', data);
  return res.data;
}

// Get single student details
export async function fetchStudentDetail(id) {
  const res = await axiosInstance.get(`/students/${id}/`);
  return res.data;
}

// Update student
export async function updateStudent(id, data) {
  const res = await axiosInstance.put(`/students/${id}/update/`, data);
  return res.data;
}

// Delete student
export async function deleteStudent(id) {
  await axiosInstance.delete(`/students/${id}/delete/`);
}

// Fetch attendance for a student
export async function fetchStudentAttendance(id) {
  try {
    const res = await axiosInstance.get(`/students/attendance/student/${id}/`);
    console.log('Student attendance response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    throw error;
  }
}

// Fetch assessments for a student
export async function fetchStudentAssessments(id) {
  const res = await axiosInstance.get(`/students/assessments/student/${id}/`);
  return res.data;
}

// Add student attendance
export async function addStudentAttendance(data) {
  const res = await axiosInstance.post('/students/attendance/add/', data);
  return res.data;
}

// Add student assessment
export async function addStudentAssessment(data) {
  const res = await axiosInstance.post('/students/assessments/add/', data);
  return res.data;
}

// Fetch today's attendance for all students
export async function fetchTodayAttendance() {
  try {
    const res = await axiosInstance.get('/students/attendance/today/');
    console.log('Today attendance response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    throw error;
  }
}

// Fetch school assessment averages
export async function fetchSchoolAssessmentAverages() {
  const res = await axiosInstance.get('/students/assessments/averages/school/');
  return res.data;
}