import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useOutletContext } from 'react-router-dom';

const ResourceMgmt = () => {
  const [resourceRequests, setResourceRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dashboardData } = useOutletContext();

  useEffect(() => {
    const fetchResourceRequests = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/schools/resources/');
        setResourceRequests(response.data);
      } catch (err) {
        console.error("Failed to fetch resource requests:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourceRequests();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-blue-500 border-opacity-50"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading Resource Requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow-md m-4">
        Error loading resource requests: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Resource Management ({resourceRequests.length})</h2>
      <p className="text-gray-600">This page displays and allows management of resource requests from schools.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resourceRequests.map(request => (
          <div key={request.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-purple-700">{request.resource_type} - {request.quantity} units</h3>
            <p className="text-sm text-gray-600">School: {request.school}</p>
            <p className="text-sm text-gray-600">Status: <span className={`font-bold ${request.status === 'PENDING' ? 'text-yellow-600' : request.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>{request.status}</span></p>
            <p className="text-sm text-gray-600">Requested by: {request.requested_by}</p>
            <p className="text-sm text-gray-600">Description: {request.description}</p>
            <p className="text-sm text-gray-600">Created At: {new Date(request.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {dashboardData && (
        <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-md">
          <p className="font-semibold">Dashboard Data Context:</p>
          <p>Pending Resource Requests (from dashboard context): {dashboardData.resource_requests.pending}</p>
        </div>
      )}
    </div>
  );
};

export default ResourceMgmt;
