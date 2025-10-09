import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Assessments = () => {
  const { dashboardData } = useOutletContext();

  // Data transformation for Bar Chart (similar to CountyOverview but for this specific page)
  const assessmentChartData = dashboardData?.assessments ? Object.keys(dashboardData.assessments).map(subject => ({
    name: subject,
    'Avg Score (%)': dashboardData.assessments[subject]?.avg_percentage || 0,
  })) : [];

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Assessments Overview</h2>
      <p className="text-gray-600">This page provides an overview of assessment performance across the county.</p>
      
      {dashboardData?.assessments ? (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Average Assessment Performance by Subject (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assessmentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis domain={[0, 100]} stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="Avg Score (%)" fill="#4C51BF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-4 text-gray-500">Further detailed assessment reports will be available here.</p>
        </div>
      ) : (
        <p className="mt-4 text-gray-500">No assessment data available from the dashboard overview.</p>
      )}

      {/* TODO: Add functionality to fetch and display detailed assessment data (e.g., by school, by student, historical trends) */}
      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md">
        <p className="font-semibold">Future Enhancements:</p>
        <p>Implement tables for individual student assessments, filtering by school/subject, and options to add new assessments using `/api/students/assessments/add/`.</p>
      </div>
    </div>
  );
};

export default Assessments;
