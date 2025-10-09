import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardData } from '../api/dashboard';
import { useNavigate } from 'react-router-dom';
import TimetableForm from '../components/TimetableForm';
import LeaveRequestForm from '../components/LeaveRequestForm';
import ResourceRequestForm from '../components/ResourceRequestForm';
import ProfessionalDevelopmentLog from '../components/ProfessionalDevelopmentLog';
import SchoolOverview from '../components/SchoolOverview';
import StudentList from '../components/StudentList';
import StudentForm from '../components/StudentForm';
import StudentDetail from '../components/StudentDetail';
import AttendanceForm from '../components/AttendanceForm';
import BatchAssessmentForm from '../components/BatchAssessmentForm';
import { MessageSquareText } from 'lucide-react'; // Changed from MessageCircle
import TeacherChatInterface from '../components/chat/TeacherChatInterface'; // Import TeacherChatInterface

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [studentId, setStudentId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat visibility
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0); // New state for unread messages
  const navigate = useNavigate();

  // set backend host for websocket connection
  const BACKEND_HOST = 'educhain-ai.onrender.com';

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchDashboardData('TEACHER');
        setData(result);
      } catch (err) {
        setError('Failed to load school dashboard data. Check API connection and role access.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, navigate]);

  // WebSocket for total unread messages
  useEffect(() => {
    if (!user?.id) return;

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.error("TeacherDashboard: Authentication token is missing for unread count WebSocket.");
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

  // Inline styles for demonstration, consider using TailwindCSS for consistency
  const headerStyle = {
    backgroundColor: 'var(--color-secondary)',
    color: 'var(--color-white)',
    padding: '20px',
    borderRadius: 'var(--border-radius)',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative', // Needed for absolute positioning of logout button
  };

  const userInfoStyle = {
    flexGrow: 1, // Allows user info to take available space
    textAlign: 'center',
  };

  const tabStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center'
  };

  const tabButtonStyle = active => ({
    padding: '10px 20px',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid #eee',
    background: 'none',
    color: active ? 'var(--color-primary)' : '#888',
    fontWeight: active ? 'bold' : 'normal',
    cursor: 'pointer',
    outline: 'none',
    fontSize: '1rem',
  });

  if (loading) return <div className="app-container">Loading Teacher Dashboard...</div>;
  if (error) return <div className="app-container error-message">Error: {error}</div>;

  return (
    <div className="app-container">
      <div style={headerStyle}>
        <h1 style={{margin: 0}}>Teacher Dashboard</h1>
        <div style={userInfoStyle}>
            <p>Welcome, {user?.first_name || user?.email} (Role: {user?.role})</p>
        </div>
        {/* Messenger Icon */}
        <button 
            className="button relative" 
            style={{width: 'auto', backgroundColor: 'transparent', color: 'var(--color-white)', border: 'none', padding: '0 10px'}}
            onClick={() => setIsChatOpen(!isChatOpen)}
        >
            <MessageSquareText size={28} />
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalUnreadMessages}
              </span>
            )}
        </button>
        {/* Logout Button */}
        <button className="button" style={{width: 'auto', backgroundColor: '#e7e7e7', color: 'var(--color-text)', marginLeft: 'auto'}} onClick={logout}>Logout</button>
      </div>

      <div style={tabStyle}>
        <button style={tabButtonStyle(tab === 'overview')} onClick={() => setTab('overview')}>Overview</button>
        <button style={tabButtonStyle(tab === 'students')} onClick={() => setTab('students')}>Students</button>
        <button style={tabButtonStyle(tab === 'attendance')} onClick={() => setTab('attendance')}>Attendance</button>
        <button style={tabButtonStyle(tab === 'assessments')} onClick={() => setTab('assessments')}>Assessments</button>
        <button style={tabButtonStyle(tab === 'timetable')} onClick={() => setTab('timetable')}>Timetable</button>
        <button style={tabButtonStyle(tab === 'leave')} onClick={() => setTab('leave')}>Leave Request</button>
        <button style={tabButtonStyle(tab === 'resource')} onClick={() => setTab('resource')}>Resource Request</button>
        <button style={tabButtonStyle(tab === 'pdlog')} onClick={() => setTab('pdlog')}>Professional Development</button>
      </div>

      {tab === 'overview' && (
        <SchoolOverview overview={data} />
      )}

      {tab === 'attendance' && <AttendanceForm />}
      {tab === 'assessments' && <BatchAssessmentForm />}
      {tab === 'timetable' && <TimetableForm />}
      {tab === 'leave' && <LeaveRequestForm />}
      {tab === 'resource' && <ResourceRequestForm />}
      {tab === 'pdlog' && <ProfessionalDevelopmentLog />} 
      
      {tab === 'students' && (
        <div>
          {!showForm && !showDetail && (
            <>
              <button className="button primary" onClick={() => { setStudentId(null); setShowForm(true); }}>Add Student</button>
              <StudentList 
                onSelect={(id, edit) => { 
                  if (edit) {
                    setStudentId(id); 
                    setShowForm(true); 
                  } else {
                    setStudentId(id);
                    setShowDetail(true);
                  }
                }} 
                canEdit={true} 
              />
            </>
          )}
          {showForm && (
            <StudentForm 
              studentId={studentId} 
              onSuccess={() => { 
                setShowForm(false); 
                setStudentId(null); 
              }} 
              onCancel={() => setShowForm(false)} 
            />
          )}
          {showDetail && (
            <StudentDetail 
              studentId={studentId} 
              onClose={() => {
                setShowDetail(false);
                setStudentId(null);
              }} 
            />
          )}
        </div>
      )}
      {/* Render ChatInterface component when isChatOpen is true */}
      <TeacherChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} updateTotalUnreadMessages={setTotalUnreadMessages} />
    </div>
  );
};

export default TeacherDashboard;
