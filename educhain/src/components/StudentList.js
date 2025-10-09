import React, { useEffect, useState } from 'react';
import { fetchStudents, deleteStudent } from '../api/students';

const StudentList = ({ onSelect, canEdit, onRefresh }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const loadStudents = async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(studentId);
    try {
      await deleteStudent(studentId);
      setStudents(students.filter(s => s.id !== studentId));
      onRefresh && onRefresh();
    } catch (error) {
      alert('Failed to delete student. Please try again.');
      console.error('Delete error:', error);
    } finally {
      setDeleting(null);
    }
  };

  const calculateAge = (dateOfBirth) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div>Loading students...</div>;
  if (!students.length) return <div>No students found.</div>;

  return (
    <div>
      <h4>Students</h4>
      <table style={{ width: '100%', marginBottom: 20 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Admission Date</th>
            <th>Parents</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id}>
              <td>{s.first_name} {s.last_name}</td>
              <td>{calculateAge(s.date_of_birth)}</td>
              <td>{s.gender}</td>
              <td>{new Date(s.admission_date).toLocaleDateString()}</td>
              <td>
                {s.parents?.map(p => (
                  <div key={p.id}>
                    {p.user} - {p.phone} ({p.relation_type})
                  </div>
                ))}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="button" onClick={() => onSelect(s.id)}>View</button>
                  {canEdit && (
                    <>
                      <button className="button" onClick={() => onSelect(s.id, true)}>Edit</button>
                      <button 
                        className="button" 
                        style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}
                        onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                        disabled={deleting === s.id}
                      >
                        {deleting === s.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;
