import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AIAnalytics = () => {
  const [insights, setInsights] = useState([]);
  const [rules, setRules] = useState({}); // Keep rules state for potential future use, but not displayed as raw JSON
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [errorInsights, setErrorInsights] = useState(null);
  const [errorRules, setErrorRules] = useState(null);
  const [sortBy, setSortBy] = useState('generated_at'); // Default sort
  const [sortOrder, setSortOrder] = useState('desc'); // Default order
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // Filter by severity
  const [filterStatus, setFilterStatus] = useState('ACTIVE'); // Filter by status

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoadingInsights(true);
        const response = await axiosInstance.get('/reports/analytics/');
        setInsights(response.data);
      } catch (err) {
        console.error("Failed to fetch AI insights:", err);
        setErrorInsights(err);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    const fetchRules = async () => {
      try {
        setIsLoadingRules(true);
        const response = await axiosInstance.get('/analytics/rules/');
        setRules(response.data);
      } catch (err) {
        console.error("Failed to fetch analytics rules:", err);
        setErrorRules(err);
      } finally {
        setIsLoadingRules(false);
      }
    };

    fetchInsights();
    fetchRules(); // Still fetch rules in case they are needed for future UI
  }, []);

  // Filter and Sort Logic
  const filteredAndSortedInsights = [...insights]
    .filter(insight => {
      if (filterSeverity !== 'ALL' && insight.severity !== filterSeverity) return false;
      if (filterStatus !== 'ALL' && insight.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'severity') {
        const severityOrder = { CRITICAL: 3, WARNING: 2, INFO: 1 };
        compareValue = severityOrder[a.severity] - severityOrder[b.severity];
      } else if (sortBy === 'status') {
        compareValue = a.status.localeCompare(b.status);
      } else if (sortBy === 'generated_at') {
        compareValue = new Date(a.generated_at) - new Date(b.generated_at);
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-700 bg-red-100';
      case 'WARNING': return 'text-yellow-700 bg-yellow-100';
      case 'INFO': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-700 bg-green-100';
      case 'RESOLVED': return 'text-indigo-700 bg-indigo-100';
      case 'ARCHIVED': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (isLoadingInsights || isLoadingRules) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-blue-500 border-opacity-50"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading AI Analytics Data...</p>
        </div>
      </div>
    );
  }

  if (errorInsights || errorRules) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow-md m-4">
        Error loading AI Analytics data: {errorInsights?.message || errorRules?.message}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Analytics & Insights</h2>
      
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Filters & Sorting</h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700">Sort by</label>
            <select
              id="sort-by"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="generated_at">Generated At</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700">Order</label>
            <select
              id="sort-order"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-severity" className="block text-sm font-medium text-gray-700">Filter by Severity</label>
            <select
              id="filter-severity"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select
              id="filter-status"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Latest Insights ({filteredAndSortedInsights.length})</h3>
        {filteredAndSortedInsights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedInsights.map(insight => (
              <div key={insight.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800">Insight: {insight.rule_name}</h4>
                <p className="text-sm text-gray-700">School: {insight.school_name}</p>
                <p className="text-sm text-gray-600 mt-1">Message: {insight.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(insight.severity)}`}>
                    {insight.severity}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(insight.status)}`}>
                    {insight.status}
                  </span>
                  <span className="text-xs text-gray-500">Generated: {new Date(insight.generated_at).toLocaleDateString()}</span>
                </div>
                {insight.context_data && Object.keys(insight.context_data).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p className="font-semibold">Context Data:</p>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(insight.context_data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No AI insights available based on current filters.</p>
        )}
      </div>
    </div>
  );
};

export default AIAnalytics;
