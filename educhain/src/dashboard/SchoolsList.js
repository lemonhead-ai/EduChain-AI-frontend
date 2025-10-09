import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useOutletContext } from 'react-router-dom';

const SchoolsList = () => {
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dashboardData } = useOutletContext(); // Access dashboardData from parent layout

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/schools/all/');
        setSchools(response.data);
      } catch (err) {
        console.error("Failed to fetch schools:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-blue-500 border-opacity-50"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading Schools Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow-md m-4">
        Error loading schools data: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Schools List ({schools.length})</h2>
      <p className="text-gray-600">This page displays a list of all schools managed by the county.</p>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map(school => (
          <div key={school.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-blue-700">{school.name}</h3>
            <p className="text-sm text-gray-600">Code: {school.code}</p>
            <p className="text-sm text-gray-600">Subcounty: {school.subcounty}</p>
            <p className="text-sm text-gray-600">Headteacher: {school.headteacher}</p>
            <p className="text-sm text-gray-600">Created At: {new Date(school.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {dashboardData && (
        <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-md">
          <p className="font-semibold">Dashboard Data Context:</p>
          <p>Total Schools (from dashboard context): {dashboardData.schools}</p>
        </div>
      )}
    </div>
  );
};

export default SchoolsList;
