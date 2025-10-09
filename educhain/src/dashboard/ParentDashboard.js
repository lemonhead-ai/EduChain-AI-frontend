import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardData } from '../api/reports';
import { MessageSquareText } from 'lucide-react';
import ParentSidePanel from '../components/ParentSidePanel'; // Import the new side panel
import { fetchStudentAssessments } from '../api/students'; // Import fetchStudentAssessments
import { fetchUserProfile } from '../api/auth'; // Import fetchUserProfile
import ParentChatInterface from '../components/chat/ParentChatInterface'; // Import ParentChatInterface

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // State to manage active tab
  const [performanceData, setPerformanceData] = useState(null); // New state for performance data
  const [performanceLoading, setPerformanceLoading] = useState(false); // New state for performance loading
  const [performanceError, setPerformanceError] = useState(''); // New state for performance error
  const [profileData, setProfileData] = useState(null); // New state for profile data
  const [profileLoading, setProfileLoading] = useState(false); // New state for profile loading
  const [profileError, setProfileError] = useState(''); // New state for profile error
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0); // New state for unread messages

  // set backend host for websocket connection
  const BACKEND_HOST = 'educhain-ai.onrender.com';

  // Derived state for unique teachers
  const uniqueTeachers = useMemo(() => {
    const teachers = new Map();
    data?.children?.forEach(child => {
      if (child.student.enrolling_teacher) {
        const teacher = child.student.enrolling_teacher;
        teachers.set(teacher.id, teacher);
      }
    });
    return Array.from(teachers.values());
  }, [data]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchDashboardData('PARENT');
        setData(result);
      } catch (err) {
        setError('Failed to load parent dashboard data. Check API connection and role access.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // WebSocket for total unread messages
  useEffect(() => {
    if (!user?.id) return;

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.error("ParentDashboard: Authentication token is missing for unread count WebSocket.");
      return;
    }

    const unreadWsUrl = `wss://${BACKEND_HOST}/ws/unread_count/?token=${accessToken}`;
    const ws = new WebSocket(unreadWsUrl);

    ws.onopen = () => {
      console.log('Unread count WebSocket connection opened.');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.unread_count !== undefined) {
        setTotalUnreadMessages(data.unread_count);
      }
    };

    ws.onerror = (err) => {
      console.error('Unread count WebSocket error:', err);
    };

    ws.onclose = (event) => {
      console.log('Unread count WebSocket connection closed.', event);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  useEffect(() => {
    if (activeTab === 'performance' && data?.student_stats?.id) {
      const loadPerformanceData = async () => {
        setPerformanceLoading(true);
        try {
          const result = await fetchStudentAssessments(data.student_stats.id);
          setPerformanceData(result);
        } catch (err) {
          setPerformanceError('Failed to load performance data.');
          console.error(err);
        } finally {
          setPerformanceLoading(false);
        }
      };
      loadPerformanceData();
    }
  }, [activeTab, data]);

  useEffect(() => {
    if (activeTab === 'profile') {
      const loadProfileData = async () => {
        setProfileLoading(true);
        try {
          const result = await fetchUserProfile();
          setProfileData(result);
        } catch (err) {
          setProfileError('Failed to load profile data.');
          console.error(err);
        } finally {
          setProfileLoading(false);
        }
      };
      loadProfileData();
    }
  }, [activeTab]);

  const headerStyle = { 
    backgroundColor: 'var(--color-primary)', 
    color: 'var(--color-white)', 
    padding: '20px', 
    borderRadius: 'var(--border-radius)',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  
  if (loading) return <div className="app-container">Loading Parent Dashboard...</div>;
  if (error) return <div className="app-container error-message">Error: {error}</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <ParentSidePanel activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
      <div style={headerStyle}>
        <h1 style={{margin: 0}}>Parent Dashboard</h1>
        <p>Welcome, {user?.first_name || user?.email} (Role: {user?.role})</p>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}> 
            <button 
                className="button relative" 
                style={{width: 'auto', backgroundColor: 'transparent', color: 'var(--color-white)', border: 'none', padding: '0'}}
                onClick={() => setIsChatOpen(!isChatOpen)}
            >
                <MessageSquareText size={28} />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalUnreadMessages}
                  </span>
                )}
            </button>
        <button className="button" style={{width: 'auto', backgroundColor: '#e7e7e7', color: 'var(--color-text)'}} onClick={logout}>Logout</button>
          </div>
      </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          {activeTab === 'overview' && (
      <div className="card" style={{maxWidth: 'none', margin: 0}}>
              <h3>Your Children Overview</h3>
              {data?.children && data.children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {data.children.map((child, index) => (
                    <div key={index} className="border p-4 rounded-md shadow-sm bg-white">
                      <h4 className="text-lg font-semibold text-blue-700">{child.student.first_name} {child.student.last_name}</h4>
                      <p><strong>Gender:</strong> {child.student.gender}</p>
                      <p><strong>School:</strong> {child.student.school}</p>
                      {child.student.enrolling_teacher && (
                        <p><strong>Teacher:</strong> {child.student.enrolling_teacher.first_name} {child.student.enrolling_teacher.last_name}</p>
                      )}
                      <p><strong>Attendance:</strong> {child.attendance.length > 0 ? 'Data Available' : 'No Data'}</p>
                      <p><strong>Assessments:</strong> {Object.keys(child.assessments.summary).length > 0 ? 'Data Available' : 'No Data'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No children data available.</p>
              )}
            </div>
          )}
          {activeTab === 'performance' && (
            <div className="card">
              <h3>Performance Overview</h3>
              {performanceLoading && <p>Loading performance data...</p>}
              {performanceError && <p className="text-red-500">Error: {performanceError}</p>}
              {data?.children && data.children.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {data.children.map((child, childIndex) => (
                    <div key={childIndex} className="border p-4 rounded-md shadow-sm bg-white">
                      <h4 className="text-lg font-semibold text-blue-700">{child.student.first_name} {child.student.last_name} - Assessments</h4>
                      {Object.keys(child.assessments.summary).length > 0 ? (
                        <ul className="list-disc list-inside mt-2">
                          {Object.entries(child.assessments.summary).map(([subject, score]) => (
                            <li key={subject}><strong>{subject}:</strong> {score}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No assessment summary available for this student.</p>
                      )}
                      {child.assessments.recent && child.assessments.recent.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium">Recent Assessments:</h5>
                          <ul className="list-disc list-inside ml-4">
                            {child.assessments.recent.map((assessment, assessmentIndex) => (
                              <li key={assessmentIndex}>{assessment.subject}: {assessment.score} on {new Date(assessment.date).toLocaleDateString()}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No performance data available for your children.</p>
              )}
            </div>
          )}
          {activeTab === 'incidents' && (
            <div className="card">
              <h3>Incidents</h3>
              {data?.children && data.children.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {data.children.map((child, childIndex) => (
                    <div key={childIndex} className="border p-4 rounded-md shadow-sm bg-white">
                      <h4 className="text-lg font-semibold text-blue-700">{child.student.first_name} {child.student.last_name} - Incidents</h4>
                      {child.incidents && child.incidents.length > 0 ? (
                        <ul className="list-disc list-inside mt-2">
                          {child.incidents.map((incident, incidentIndex) => (
                            <li key={incidentIndex} className="mb-1">
                              <strong>Date:</strong> {new Date(incident.date).toLocaleDateString()}, 
                              <strong>Type:</strong> {incident.type}, 
                              <strong>Description:</strong> {incident.description}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No incidents reported for this child.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No incident data available for your children.</p>
              )}
            </div>
          )}
          {activeTab === 'nutrition' && (
            <div className="card">
              <h3>Nutrition and Wellbeing</h3>
              {data?.children && data.children.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {data.children.map((child, childIndex) => (
                    <div key={childIndex} className="border p-4 rounded-md shadow-sm bg-white">
                      <h4 className="text-lg font-semibold text-blue-700">{child.student.first_name} {child.student.last_name} - Nutrition & Wellbeing</h4>
                      {child.nutrition_wellbeing && child.nutrition_wellbeing.length > 0 ? (
                        <ul className="list-disc list-inside mt-2">
                          {child.nutrition_wellbeing.map((item, itemIndex) => (
                            <li key={itemIndex} className="mb-1">
                              <strong>Date:</strong> {new Date(item.date).toLocaleDateString()},
                              <strong>Category:</strong> {item.category},
                              <strong>Notes:</strong> {item.notes}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No nutrition and wellbeing data available for this child.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No nutrition and wellbeing data available for your children.</p>
              )}
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="card">
              <h3>Chat Interface</h3>
              <ParentChatInterface 
                isOpen={true} 
                onClose={() => setActiveTab('overview')} 
                uniqueTeachers={uniqueTeachers} 
                updateTotalUnreadMessages={setTotalUnreadMessages}
              />
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="card">
              <h3>Profile Details</h3>
              {profileLoading && <p>Loading profile data...</p>}
              {profileError && <p className="text-red-500">Error: {profileError}</p>}
              {profileData ? (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <p><strong>First Name:</strong> {profileData.first_name}</p>
                  <p><strong>Last Name:</strong> {profileData.last_name}</p>
                  <p><strong>Email:</strong> {profileData.email}</p>
                  <p><strong>Role:</strong> {profileData.role}</p>
                  {/* Add more profile fields as needed */}
                </div>
              ) : (
                <p>No profile data available.</p>
              )}
          </div>
        )}
        </main>
      </div>
      {/* The ChatInterface outside the main content for overlay */}
      {isChatOpen && activeTab !== 'chat' && (
        <ParentChatInterface 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          uniqueTeachers={uniqueTeachers} 
          updateTotalUnreadMessages={setTotalUnreadMessages}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
