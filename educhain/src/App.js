import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Auth Components
import LandingPage from './LandingPage'; // <-- NEW IMPORT
import LoginPage from './auth/LoginPage';
import OnboardingPage from './auth/OnboardingPage';
import ParentSetPasswordCreate from './auth/ParentSetPasswordCreate'; // NEW IMPORT

// Dashboard Components
import ParentDashboard from './dashboard/ParentDashboard';
import TeacherDashboard from './dashboard/TeacherDashboard';
import HeadteacherDashboard from './dashboard/HeadteacherDashboard';
import CountyDashboard from './dashboard/CountyDashboard';
import RegisterSchoolPage from './schools/RegisterSchoolPage';
// New dashboard sub-components for County Officer
import CountyOverview from './dashboard/CountyOverview';
import SchoolsList from './dashboard/SchoolsList';
import StudentData from './dashboard/StudentData';
import Assessments from './dashboard/Assessments';
import ResourceMgmt from './dashboard/ResourceMgmt';
import AIAnalytics from './dashboard/AIAnalytics';

// Note: You'll need to create OfficerDashboard.js and StudentDashboard.js placeholders

// Placeholder for Forgot/Reset Password
const PasswordResetPage = () => (
  <div className="card">
    <h2 style={{color: 'var(--color-primary)', textAlign: 'center'}}>Password Reset</h2>
    <p style={{textAlign: 'center'}}>Implement POST /users/password/reset/ and /users/password/reset/confirm/ here.</p>
    <div className="input-group"><input type="email" placeholder="Enter your email" /></div>
    <button className="button primary">Send Reset Link</button>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} /> {/* <-- NEW LANDING PAGE */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/forgot-password" element={<PasswordResetPage />} />
          <Route path="/set-password/:uidb64/:token" element={<ParentSetPasswordCreate />} /> {/* NEW ROUTE */}
          
          {/* Onboarding Route (Must be authenticated, but doesn't need a role yet) */}
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

          {/* Role-Based Protected Dashboards (TEST GET ENDPOINTS HERE) */}
          <Route 
            path="/dashboard/parent" 
            element={<ProtectedRoute requiredRole="PARENT"><ParentDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/dashboard/teacher" 
            element={<ProtectedRoute requiredRole="TEACHER"><TeacherDashboard /></ProtectedRoute>} 
          />
          {/* Headteacher and Officer would use the same logic */}
          <Route 
            path="/dashboard/headteacher" 
            element={<ProtectedRoute requiredRole="HEADTEACHER"><HeadteacherDashboard /></ProtectedRoute>} 
          />
          {/* County Officer Dashboard with nested routes */}
          <Route path="/dashboard/officer" element={<ProtectedRoute requiredRole="OFFICER"><CountyDashboard /></ProtectedRoute>}>
            <Route index element={<CountyOverview />} />
            <Route path="schools" element={<SchoolsList />} />
            <Route path="students" element={<StudentData />} />
            <Route path="assessments" element={<Assessments />} />
            <Route path="resources" element={<ResourceMgmt />} />
            <Route path="ai-analytics" element={<AIAnalytics />} />
          </Route>

          <Route path="/register-school" element={<ProtectedRoute requiredRole="HEADTEACHER"><RegisterSchoolPage /></ProtectedRoute>} />
          
          {/* 404/Catch-all */}
          <Route path="*" element={<h1 style={{textAlign: 'center', marginTop: '100px'}}>404 - Page Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
