import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useOutletContext } from 'react-router-dom';

const StudentData = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dashboardData } = useOutletContext();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/students/all/');
        setStudents(response.data);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-blue-500 border-opacity-50"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading Student Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow-md m-4">
        Error loading student data: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Student Data ({students.length})</h2>
      <p className="text-gray-600">This page displays a list of all students.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(student => (
          <div key={student.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-indigo-700">{student.first_name} {student.last_name}</h3>
            <p className="text-sm text-gray-600">Gender: {student.gender}</p>
            <p className="text-sm text-gray-600">Date of Birth: {new Date(student.date_of_birth).toLocaleDateString()}</p>
            <p className="text-sm text-gray-600">School: {student.school}</p>
            <p className="text-sm text-gray-600">PWD: {student.pwd ? 'Yes' : 'No'}</p>
            {student.disability_type && <p className="text-sm text-gray-600">Disability Type: {student.disability_type}</p>}
          </div>
        ))}
      </div>

      {dashboardData && (
        <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-md">
          <p className="font-semibold">Dashboard Data Context:</p>
          <p>Total Students (from dashboard context): {dashboardData.students.total}</p>
        </div>
      )}
    </div>
  );
};

export default StudentData;
