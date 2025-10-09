import React, { useEffect, useState } from 'react';
import { fetchStudentDetail, fetchStudentAttendance, fetchStudentAssessments } from '../api/students';

const StudentDetail = ({ studentId, onClose }) => {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [studentData, attendanceData, assessmentsData] = await Promise.all([
          fetchStudentDetail(studentId),
          fetchStudentAttendance(studentId).catch(err => {
            console.warn('Failed to load attendance data:', err);
            return [];
          }),
          fetchStudentAssessments(studentId).catch(err => {
            console.warn('Failed to load assessments data:', err);
            return [];
          })
        ]);
        setStudent(studentData);
        setAttendance(attendanceData || []);
        setAssessments(assessmentsData || []);
      } catch (err) {
        setError('Failed to load student details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return '#28a745';
      case 'ABSENT': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) return <div className="app-container">Loading student details...</div>;
  if (error) return <div className="app-container error-message">{error}</div>;
  if (!student) return <div className="app-container error-message">Student not found.</div>;

  return (
    <div className="app-container">
      <div className="card" style={{maxWidth: 800, margin: '0 auto'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Student Details</h3>
          {onClose && (
            <button className="button" onClick={onClose}>Close</button>
          )}
        </div>

        {/* Student Basic Information */}
        <div style={{ marginBottom: '30px' }}>
          <h4>Basic Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div><strong>Name:</strong> {student.first_name} {student.last_name}</div>
            <div><strong>Age:</strong> {calculateAge(student.date_of_birth)} years</div>
            <div><strong>Gender:</strong> {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}</div>
            <div><strong>Date of Birth:</strong> {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not specified'}</div>
            <div><strong>Admission Date:</strong> {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'Not specified'}</div>
            <div><strong>PWD Status:</strong> {student.pwd ? 'Yes' : 'No'}</div>
            {student.pwd && <div><strong>Disability Type:</strong> {student.disability_type || 'Not specified'}</div>}
          </div>
        </div>

        {/* Parents Information */}
        {student.parents && student.parents.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h4>Parents/Guardians</h4>
            <div style={{ display: 'grid', gap: '10px' }}>
              {student.parents.map((parent, index) => (
                <div key={index} style={{ padding: '10px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius)' }}>
                  <div><strong>{parent.user}</strong> ({parent.relation_type})</div>
                  {parent.phone && <div>Phone: {parent.phone}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div style={{ marginBottom: '30px' }}>
          <h4>Recent Attendance</h4>
          {attendance.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0, 10).map(record => (
                    <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{new Date(record.date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ 
                          color: getAttendanceStatusColor(record.status),
                          fontWeight: 'bold'
                        }}>
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{record.recorded_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
              No attendance records found.
            </div>
          )}
        </div>

        {/* Assessment Records */}
        <div>
          <h4>Recent Assessments</h4>
          {assessments.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Subject</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Score</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Percentage</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Term</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.slice(0, 10).map(assessment => {
                    const percentage = assessment.max_score > 0 ? ((assessment.score / assessment.max_score) * 100).toFixed(1) : 0;
                    return (
                      <tr key={assessment.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{assessment.subject}</td>
                        <td style={{ padding: '10px' }}>{assessment.score}/{assessment.max_score}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ 
                            color: percentage >= 80 ? '#28a745' : percentage >= 60 ? '#ffc107' : percentage >= 40 ? '#fd7e14' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>{assessment.term}</td>
                        <td style={{ padding: '10px' }}>{new Date(assessment.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
              No assessment records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;