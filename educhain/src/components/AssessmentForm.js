import React, { useState, useEffect } from 'react';
import { fetchStudents, addStudentAssessment, fetchStudentAssessments } from '../api/students';

const AssessmentForm = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentAssessments, setStudentAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    student_id: '',
    subject: '',
    score: '',
    max_score: '',
    term: ''
  });

  const SUBJECTS = [
    'Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies',
    'Religious Education', 'Physical Education', 'Art & Craft', 'Music',
    'Computer Studies', 'Agriculture', 'Home Science'
  ];

  const TERMS = ['Term 1', 'Term 2', 'Term 3'];

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentAssessments(selectedStudent);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const studentsData = await fetchStudents();
      setStudents(studentsData);
    } catch (error) {
      setMessage('Failed to load students.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAssessments = async (studentId) => {
    try {
      const assessments = await fetchStudentAssessments(studentId);
      setStudentAssessments(assessments);
    } catch (error) {
      console.error('Failed to load student assessments:', error);
      setStudentAssessments([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudent(studentId);
    setFormData(prev => ({
      ...prev,
      student_id: studentId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.subject || !formData.score || !formData.max_score || !formData.term) {
      setMessage('Please fill in all required fields.');
      return;
    }

    if (parseFloat(formData.score) > parseFloat(formData.max_score)) {
      setMessage('Score cannot be greater than maximum score.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await addStudentAssessment({
        student_id: parseInt(formData.student_id),
        subject: formData.subject,
        score: parseFloat(formData.score),
        max_score: parseFloat(formData.max_score),
        term: formData.term
      });

      setMessage('Assessment recorded successfully!');
      
      // Reset form
      setFormData({
        student_id: formData.student_id, // Keep selected student
        subject: '',
        score: '',
        max_score: '',
        term: ''
      });

      // Reload assessments for the student
      if (selectedStudent) {
        loadStudentAssessments(selectedStudent);
      }
    } catch (error) {
      setMessage('Failed to record assessment.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const calculatePercentage = (score, maxScore) => {
    if (!maxScore || maxScore === 0) return 0;
    return ((score / maxScore) * 100).toFixed(1);
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return '#28a745'; // Green
    if (percentage >= 60) return '#ffc107'; // Yellow
    if (percentage >= 40) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  if (loading) return <div className="app-container">Loading students...</div>;

  return (
    <div className="app-container">
      <div className="card">
        <h3>Student Assessment</h3>

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

        {/* Student Selection */}
        <div className="input-group">
          <label>Select Student</label>
          <select 
            value={selectedStudent} 
            onChange={(e) => handleStudentSelect(e.target.value)}
            required
          >
            <option value="">Choose a student...</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} ({student.gender === 'M' ? 'Male' : 'Female'})
              </option>
            ))}
          </select>
        </div>

        {/* Assessment Form */}
        {selectedStudent && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Subject</label>
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleInputChange}
                required
              >
                <option value="">Select subject...</option>
                {SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Score</label>
                <input 
                  type="number" 
                  name="score" 
                  value={formData.score} 
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Maximum Score</label>
                <input 
                  type="number" 
                  name="max_score" 
                  value={formData.max_score} 
                  onChange={handleInputChange}
                  min="1"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Term</label>
              <select 
                name="term" 
                value={formData.term} 
                onChange={handleInputChange}
                required
              >
                <option value="">Select term...</option>
                {TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="button primary" 
              disabled={saving}
            >
              {saving ? 'Recording...' : 'Record Assessment'}
            </button>
          </form>
        )}

        {/* Student Assessment History */}
        {selectedStudent && studentAssessments.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h4>Assessment History</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Score</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Percentage</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Term</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAssessments.map(assessment => {
                    const percentage = calculatePercentage(assessment.score, assessment.max_score);
                    return (
                      <tr key={assessment.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{assessment.subject}</td>
                        <td style={{ padding: '12px' }}>
                          {assessment.score}/{assessment.max_score}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            color: getGradeColor(percentage),
                            fontWeight: 'bold'
                          }}>
                            {percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{assessment.term}</td>
                        <td style={{ padding: '12px' }}>
                          {new Date(assessment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedStudent && studentAssessments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d', marginTop: '20px' }}>
            No assessments recorded for this student yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentForm;
