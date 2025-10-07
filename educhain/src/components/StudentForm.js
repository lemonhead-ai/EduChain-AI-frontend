import React, { useState } from 'react';
import { addStudent, updateStudent, fetchStudentDetail } from '../api/students';

const DISABILITY_CHOICES = [
  { value: "VISION", label: "Visual Impairment" },
  { value: "HEARING", label: "Hearing Impairment" },
  { value: "PHYSICAL", label: "Physical Disability" },
  { value: "OTHER", label: "Other" }
];

const RELATION_CHOICES = [
  { value: "MOTHER", label: "Mother" },
  { value: "FATHER", label: "Father" },
  { value: "GUARDIAN", label: "Guardian" }
];

const initialState = {
  first_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  pwd: false,
  disability_type: '',
  parents: []
};

const emptyParent = { first_name: '', last_name: '', email: '', phone: '', relation_type: '' };

const StudentForm = ({ studentId, onSuccess, onCancel }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showParentDialog, setShowParentDialog] = useState(false);
  const [parentForm, setParentForm] = useState(emptyParent);

  React.useEffect(() => {
    if (studentId) {
      fetchStudentDetail(studentId).then(data => {
        setForm({
          ...initialState,
          ...data,
          parents: data.parents || []
        });
      });
    }
  }, [studentId]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
    // If unchecking pwd, clear disability_type
    if (name === 'pwd' && !checked) {
      setForm(f => ({ ...f, disability_type: '' }));
    }
  };

  const handleParentChange = e => {
    const { name, value } = e.target;
    setParentForm(p => ({ ...p, [name]: value }));
  };

  const addParent = () => {
    if (!parentForm.first_name || !parentForm.last_name || !parentForm.email || !parentForm.relation_type) return;
    setForm(f => ({
      ...f,
      parents: [...f.parents, parentForm]
    }));
    setParentForm(emptyParent);
    setShowParentDialog(false);
  };

  const removeParent = idx => {
    setForm(f => ({
      ...f,
      parents: f.parents.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        pwd: form.pwd,
        disability_type: form.pwd ? form.disability_type : '',
        parents: form.parents
      };
      if (studentId) {
        await updateStudent(studentId, payload);
        setMessage('Student updated!');
      } else {
        await addStudent(payload);
        setMessage('Student added!');
        setForm(initialState);
      }
      onSuccess && onSuccess();
    } catch (err) {
      setMessage('Failed to save student.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from date_of_birth
  const calcAge = dob => {
    if (!dob) return '';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="card" style={{maxWidth: 500, margin: '0 auto'}}>
      <h3>{studentId ? 'Edit Student' : 'Add Student'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>First Name</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Last Name</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Date of Birth</label>
          <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} required />
          {form.date_of_birth && (
            <span style={{marginLeft: 10, color: '#888'}}>Age: {calcAge(form.date_of_birth)}</span>
          )}
        </div>
        <div className="input-group">
          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>
        <div className="input-group">
          <label>
            <input type="checkbox" name="pwd" checked={form.pwd} onChange={handleChange} />
            Person with Disability (PWD)
          </label>
        </div>
        {form.pwd && (
          <div className="input-group">
            <label>Disability Type</label>
            <select name="disability_type" value={form.disability_type} onChange={handleChange} required>
              <option value="">Select Type</option>
              {DISABILITY_CHOICES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
        <div className="input-group">
          <label>Parents</label>
          <button type="button" className="button" onClick={() => setShowParentDialog(true)}>Add Parent</button>
          <ul>
            {form.parents.map((p, idx) => (
              <li key={idx}>
                {p.first_name} {p.last_name} ({p.relation_type}) - {p.email}
                <button type="button" className="button" style={{marginLeft: 8}} onClick={() => removeParent(idx)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : studentId ? 'Update' : 'Add'}
        </button>
        {onCancel && <button className="button" type="button" onClick={onCancel}>Cancel</button>}
        {message && <div style={{color: message.includes('Failed') ? 'red' : 'green', marginTop: 10}}>{message}</div>}
      </form>

      {/* Parent Dialog */}
      {showParentDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{maxWidth: 400, padding: 20}}>
            <h4>Add Parent</h4>
            <div className="input-group">
              <label>First Name</label>
              <input name="first_name" value={parentForm.first_name} onChange={handleParentChange} required />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input name="last_name" value={parentForm.last_name} onChange={handleParentChange} required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input name="email" type="email" value={parentForm.email} onChange={handleParentChange} required />
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input name="phone" value={parentForm.phone} onChange={handleParentChange} />
            </div>
            <div className="input-group">
              <label>Relation</label>
              <select name="relation_type" value={parentForm.relation_type} onChange={handleParentChange} required>
                <option value="">Select</option>
                {RELATION_CHOICES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button className="button primary" type="button" onClick={addParent}>Add</button>
            <button className="button" type="button" onClick={() => setShowParentDialog(false)} style={{marginLeft: 8}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentForm;