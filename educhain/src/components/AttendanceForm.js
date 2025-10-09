import React, { useState, useEffect } from 'react';
import { fetchStudents, addStudentAttendance, fetchTodayAttendance } from '../api/students';

const AttendanceForm = () => {
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [pendingChanges, setPendingChanges] = useState({}); // Store local changes before submission
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const studentsData = await fetchStudents();
      setStudents(studentsData);
      
      // Try to fetch today's attendance, but don't fail if it doesn't work
      try {
        const todayAttendance = await fetchTodayAttendance();
        console.log('Today attendance data:', todayAttendance);
        setAttendanceRecords(Array.isArray(todayAttendance) ? todayAttendance : []);
      } catch (attendanceError) {
        console.warn('Could not load today\'s attendance:', attendanceError);
        setAttendanceRecords([]);
      }
    } catch (error) {
      setMessage('Failed to load students data.');
      console.error(error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (studentId) => {
    // First check if there's a pending change
    if (pendingChanges[studentId]) {
      return pendingChanges[studentId];
    }
    
    // Then check existing records
    if (!Array.isArray(attendanceRecords)) {
      return null;
    }
    const record = attendanceRecords.find(r => r.student === studentId);
    return record ? record.status : null;
  };

  const handleAttendanceChange = (studentId, status) => {
    setMessage('');
    
    // Update pending changes instead of making immediate API call
    setPendingChanges(prev => ({
      ...prev,
      [studentId]: status
    }));
    
    setMessage(`Marked ${students.find(s => s.id === studentId)?.first_name} as ${status}. Click "Submit Attendance" to save all changes.`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return '#28a745';
      case 'ABSENT': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PRESENT': return 'Present';
      case 'ABSENT': return 'Absent';
      default: return 'Not Marked';
    }
  };

  const submitBatchAttendance = async () => {
    const changes = Object.keys(pendingChanges);
    if (changes.length === 0) {
      setMessage('No changes to submit.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Submit all changes in parallel
      const promises = changes.map(studentId => 
        addStudentAttendance({
          student_id: parseInt(studentId),
          date: selectedDate,
          status: pendingChanges[studentId]
        })
      );

      await Promise.all(promises);

      // Update local attendance records
      setAttendanceRecords(prev => {
        const currentRecords = Array.isArray(prev) ? prev : [];
        const updatedRecords = [...currentRecords];
        
        changes.forEach(studentId => {
          const existingIndex = updatedRecords.findIndex(r => r.student === parseInt(studentId));
          if (existingIndex >= 0) {
            updatedRecords[existingIndex] = {
              ...updatedRecords[existingIndex],
              status: pendingChanges[studentId]
            };
          } else {
            updatedRecords.push({
              student: parseInt(studentId),
              status: pendingChanges[studentId],
              date: selectedDate
            });
          }
        });
        
        return updatedRecords;
      });

      // Clear pending changes
      setPendingChanges({});
      setMessage(`Successfully submitted attendance for ${changes.length} student(s)!`);
    } catch (error) {
      setMessage('Failed to submit attendance. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const clearPendingChanges = () => {
    setPendingChanges({});
    setMessage('Pending changes cleared.');
  };

  if (loading) return <div className="app-container">Loading attendance data...</div>;

  return (
    <div className="app-container">
      <div className="card">
        <h3>Student Attendance</h3>
        
        <div className="input-group">
          <label>Date</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {message && (
          <div style={{ 
            color: message.includes('Failed') ? 'var(--color-danger)' : 'var(--color-secondary)', 
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: message.includes('Failed') ? '#f8d7da' : '#d4edda',
            borderRadius: 'var(--border-radius)'
          }}>
            {message}
          </div>
        )}

        {/* Batch Submission Controls */}
        {Object.keys(pendingChanges).length > 0 && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: 'var(--border-radius)',
            border: '1px solid #2196f3'
          }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#1976d2' }}>
              Pending Changes ({Object.keys(pendingChanges).length} student{Object.keys(pendingChanges).length !== 1 ? 's' : ''})
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="button primary" 
                onClick={submitBatchAttendance}
                disabled={saving}
                style={{ padding: '8px 16px' }}
              >
                {saving ? 'Submitting...' : 'Submit Attendance'}
              </button>
              <button 
                className="button" 
                onClick={clearPendingChanges}
                disabled={saving}
                style={{ padding: '8px 16px' }}
              >
                Clear Changes
              </button>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Student Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Gender</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Current Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const currentStatus = getAttendanceStatus(student.id);
                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      {student.first_name} {student.last_name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        color: getStatusColor(currentStatus),
                        fontWeight: 'bold'
                      }}>
                        {getStatusText(currentStatus)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="button"
                          style={{
                            backgroundColor: currentStatus === 'PRESENT' ? 'var(--color-secondary)' : '#e9ecef',
                            color: currentStatus === 'PRESENT' ? 'white' : 'var(--color-text)',
                            padding: '6px 12px',
                            fontSize: '0.9rem',
                            border: pendingChanges[student.id] === 'PRESENT' ? '2px solid #2196f3' : '1px solid #ddd'
                          }}
                          onClick={() => handleAttendanceChange(student.id, 'PRESENT')}
                          disabled={saving}
                        >
                          Present {pendingChanges[student.id] === 'PRESENT' && '✓'}
                        </button>
                        <button
                          className="button"
                          style={{
                            backgroundColor: currentStatus === 'ABSENT' ? 'var(--color-danger)' : '#e9ecef',
                            color: currentStatus === 'ABSENT' ? 'white' : 'var(--color-text)',
                            padding: '6px 12px',
                            fontSize: '0.9rem',
                            border: pendingChanges[student.id] === 'ABSENT' ? '2px solid #2196f3' : '1px solid #ddd'
                          }}
                          onClick={() => handleAttendanceChange(student.id, 'ABSENT')}
                          disabled={saving}
                        >
                          Absent {pendingChanges[student.id] === 'ABSENT' && '✓'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No students found. Add students first to manage attendance.
          </div>
        )}

        {students.length > 0 && attendanceRecords.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d', backgroundColor: '#f8f9fa', borderRadius: 'var(--border-radius)', marginTop: '20px' }}>
            No attendance records found for today. Start marking attendance below.
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceForm;
