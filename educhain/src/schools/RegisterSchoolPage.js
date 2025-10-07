import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SUBCOUNTIES = [
  "Westlands", "Langata", "Embakasi East", "Embakasi West", "Embakasi South",
  "Embakasi Central", "Embakasi North", "Dagoretti North", "Dagoretti South",
  "Kasarani", "Roysambu", "Mathare", "Starehe", "Kamukunji", "Makadara"
];

const RegisterSchoolPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    code: '',
    subcounty: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm({
          ...form,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      err => setError('Failed to get location: ' + err.message)
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: form.name,
        code: form.code,
        subcounty: form.subcounty,
      };
      if (form.latitude && form.longitude) {
        payload.latitude = form.latitude;
        payload.longitude = form.longitude;
      }
      const res = await axiosInstance.post('/schools/register/', payload);
      setSuccess('School registered successfully!');
      // Update user context with new school
      updateUser({ school: res.data });
      // Redirect to dashboard after success
      setTimeout(() => {
        navigate('/dashboard/headteacher', { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.code || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 500, margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--color-primary)' }}>Register Your School</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>School Name</label>
          <input name="name" value={form.name} onChange={handleChange} required maxLength={255} />
        </div>
        <div className="input-group">
          <label>School Code</label>
          <input name="code" value={form.code} onChange={handleChange} required maxLength={20} />
        </div>
        <div className="input-group">
          <label>Subcounty</label>
          <select name="subcounty" value={form.subcounty} onChange={handleChange} required>
            <option value="">Select Subcounty</option>
            {SUBCOUNTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Location (optional)</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              placeholder="Latitude"
              type="number"
              step="any"
            />
            <input
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              placeholder="Longitude"
              type="number"
              step="any"
            />
            <button type="button" className="button" onClick={getLocation}>Get Location</button>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? 'Registering...' : 'Register School'}
        </button>
      </form>
    </div>
  );
};

export default RegisterSchoolPage;