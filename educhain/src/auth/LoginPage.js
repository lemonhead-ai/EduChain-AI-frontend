import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signupUser } from '../api/auth';
import Toast from '../components/Toast';

const LOGIN_ROLES = [
  { value: "HEADTEACHER", label: "Headteacher" },
  { value: "TEACHER", label: "Teacher" },
  { value: "OFFICER", label: "County Officer" },
];

function SignupForm({ showToast }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localMessage, setLocalMessage] = useState({ message: '', type: '' });

  const passwordsMatch = password === confirmPassword;

  // Fetch schools on mount
  useEffect(() => {
    setSchoolsLoading(true);
    fetch(process.env.REACT_APP_API_URL + '/schools/all/')
      .then(res => res.json())
      .then(data => {
        setSchools(data);
        setSchoolsLoading(false);
      })
      .catch(() => setSchoolsLoading(false));
  }, []);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLocalMessage({ message: '', type: '' });
    if (password.length < 8) {
      return setLocalMessage({ message: 'Password must be at least 8 characters.', type: 'error' });
    }
    if (!passwordsMatch) {
      return setLocalMessage({ message: 'Passwords do not match.', type: 'error' });
    }
    if (!role) {
      return setLocalMessage({ message: 'Please select a role.', type: 'error' });
    }
    if (role === 'TEACHER' && !schoolId) {
      return setLocalMessage({ message: 'Please select your school.', type: 'error' });
    }
    setIsProcessing(true);
    try {
      const signupRes = await signupUser({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role,
        ...(phoneNumber && { phone_number: phoneNumber }),
        ...(role === 'TEACHER' && { school: schoolId }),
      });

      // Automatically log in the user after signup
      const userProfile = await login(email, password);

      // Redirect logic after login
      if (userProfile.role === 'HEADTEACHER' && !userProfile.school) {
        navigate('/register-school', { replace: true });
        return;
      }

      // Redirect to dashboard based on role
      if (userProfile.role) {
        navigate(`/dashboard/${userProfile.role.toLowerCase()}`, { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }

      setLocalMessage({ message: 'Account created! Redirecting...', type: 'success' });
      setFirstName(''); setLastName(''); setEmail(''); setPhoneNumber(''); setRole(''); setPassword(''); setConfirmPassword(''); setSchoolId('');
    } catch (err) {
      const apiError = err.response?.data?.email?.[0] ||
        err.response?.data?.role?.[0] ||
        err.message ||
        'Signup failed. Please try again.';
      setLocalMessage({ message: apiError, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <div className="input-group">
        <label>First Name</label>
        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
      </div>
      <div className="input-group">
        <label>Last Name</label>
        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
      </div>
      <div className="input-group">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="input-group">
        <label>Phone Number</label>
        <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
      </div>
      <div className="input-group">
        <label>Role</label>
        <select value={role} onChange={e => setRole(e.target.value)} required>
          <option value="">Select your role...</option>
          {LOGIN_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      {/* Show school selection only if role is TEACHER */}
      {role === 'TEACHER' && (
        <div className="input-group">
          <label>Select School</label>
          {schoolsLoading ? (
            <div style={{ color: '#888' }}>Loading schools...</div>
          ) : (
            <select value={schoolId} onChange={e => setSchoolId(e.target.value)} required>
              <option value="">Choose your school...</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.code})
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      <div className="input-group">
        <label>Password (min 8 chars)</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="8" />
      </div>
      <div className="input-group">
        <label>Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength="8" />
        {!passwordsMatch && confirmPassword && (
          <p style={{ color: '#D32F2F', fontSize: '0.8rem', marginTop: '5px' }}>Passwords must match.</p>
        )}
      </div>
      <button type="submit" className="button primary" disabled={isProcessing}>
        {isProcessing ? 'Signing up...' : 'Sign Up'}
      </button>
      <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#888' }}>
        API: <code>POST /users/signup/</code>
      </div>
      <Toast
        message={localMessage.message}
        type={localMessage.type}
        onClose={() => setLocalMessage({ message: '', type: '' })}
      />
    </form>
  );
}

function LoginForm({ showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [localMessage, setLocalMessage] = useState({ message: '', type: '' });

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role) {
        navigate(`/dashboard/${user.role.toLowerCase()}`, { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isAuthenticated, user?.role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalMessage({ message: '', type: '' });
    try {
      await login(email, password); // POST /users/login/
    } catch (err) {
      const apiError = err.response?.data?.email?.[0] ||
        err.message ||
        'Login failed. Please try again.';
      setLocalMessage({ message: apiError, type: 'error' });
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="input-group">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="input-group">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="8" />
      </div>
      <button type="submit" className="button primary" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
      <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#888' }}>
        API: <code>POST /users/login/</code>
      </div>
      <Toast
        message={localMessage.message}
        type={localMessage.type}
        onClose={() => setLocalMessage({ message: '', type: '' })}
      />
    </form>
  );
}

const LoginPage = () => {
  const [tab, setTab] = useState('login');
  const tabStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  };
  const buttonStyle = active => ({
    padding: '10px 30px',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid #eee',
    background: 'none',
    color: active ? 'var(--color-primary)' : '#888',
    fontWeight: active ? 'bold' : 'normal',
    cursor: 'pointer',
    outline: 'none',
    fontSize: '1rem',
  });

  return (
    <div className="card">
      <div style={tabStyle}>
        <button style={buttonStyle(tab === 'login')} onClick={() => setTab('login')}>Log In</button>
        <button style={buttonStyle(tab === 'signup')} onClick={() => setTab('signup')}>Sign Up</button>
      </div>
      {tab === 'login' ? <LoginForm /> : <SignupForm />}
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
        <a href="/forgot-password" style={{ color: 'var(--color-primary)' }}>Forgot Password?</a>
      </div>
    </div>
  );
};

export default LoginPage;
