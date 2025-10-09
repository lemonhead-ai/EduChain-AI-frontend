import React, { useState, useEffect } from 'react';
import { fetchStudents, addStudentAssessment } from '../api/students';

const BatchAssessmentForm = () => {
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');

  const SUBJECTS = [
    { key: 'MATHEMATICS', label: 'Mathematics', short: 'Maths' },
    { key: 'ENGLISH', label: 'English', short: 'English' },
    { key: 'KISWAHILI', label: 'Kiswahili', short: 'Kiswahili' },
    { key: 'SOCIAL_STUDIES', label: 'Social Studies', short: 'Social' },
    { key: 'RELIGIOUS_EDUCATION', label: 'Religious Education', short: 'Religious' }
  ];

  const TERMS = ['Term 1', 'Term 2', 'Term 3'];

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const studentsData = await fetchStudents();
      setStudents(studentsData);
      
      const initialAssessments = {};
      studentsData.forEach(student => {
        initialAssessments[student.id] = {};
        SUBJECTS.forEach(subject => {
          initialAssessments[student.id][subject.key] = {
            score: '',
            term: selectedTerm
          };
        });
      });
      setAssessments(initialAssessments);
    } catch (error) {
      setMessage('Failed to load students.');
      console.error(error);
      setAssessments({});
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId, subject, value) => {
    setAssessments(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subject]: {
          ...prev[studentId][subject],
          score: value,
          term: selectedTerm
        }
      }
    }));
  };

  const getValidAssessments = () => {
    const valid = [];
    
    Object.keys(assessments).forEach(studentId => {
      SUBJECTS.forEach(subject => {
        const assessment = assessments[studentId]?.[subject.key];
        if (assessment && assessment.score) {
          const score = parseFloat(assessment.score);
          
          if (!isNaN(score) && score >= 0 && score <= 100) {
            valid.push({
              student_id: parseInt(studentId),
              subject: subject.key,
              score: score,
              term: assessment.term
            });
          }
        }
      });
    });
    
    return valid;
  };

  const submitBatchAssessments = async () => {
    const validAssessments = getValidAssessments();
    
    if (validAssessments.length === 0) {
      setMessage('No valid assessments to submit. Please enter scores between 0 and 100.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const promises = validAssessments.map(assessment => 
        addStudentAssessment(assessment)
      );

      await Promise.all(promises);
      
      setMessage(`Successfully submitted ${validAssessments.length} assessment(s)!`);
      
      const clearedAssessments = {};
      students.forEach(student => {
        clearedAssessments[student.id] = {};
        SUBJECTS.forEach(subject => {
          clearedAssessments[student.id][subject.key] = {
            score: '',
            term: selectedTerm
          };
        });
      });
      setAssessments(clearedAssessments);
      
    } catch (error) {
      setMessage('Failed to submit assessments. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="app-container">Loading students...</div>;

  return (
    <div className="app-container">
      <div className="card">
        <h3>Batch Assessment Entry</h3>
        
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label>Term</label>
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{ maxWidth: '200px' }}
          >
            {TERMS.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
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

        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: 'var(--border-radius)',
          fontSize: '0.9rem'
        }}>
          <strong>Instructions:</strong> Enter scores between 0 and 100. 
          Leave empty for students who didn't take the assessment.
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table style={{ width: '80%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  borderBottom: '1px solid #ddd',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'var(--color-background)',
                  zIndex: 1
                }}>
                  Student Name
                </th>
                {SUBJECTS.map(subject => (
                  <th key={subject.key} style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    borderBottom: '1px solid #ddd',
                    minWidth: '120px'
                  }}>
                    {subject.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ 
                    padding: '12px', 
                    fontWeight: 'bold',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'white',
                    zIndex: 1
                  }}>
                    {student.first_name} {student.last_name}
                  </td>
                  {SUBJECTS.map(subject => {
                    const assessment = assessments[student.id]?.[subject.key];
                    
                    return (
                      <td key={subject.key} style={{ padding: '8px', textAlign: 'center' }}>
                        <input
                          type="number"
                          placeholder="Score (0-100)"
                          value={assessment?.score || ''}
                          onChange={(e) => handleScoreChange(student.id, subject.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '0.9rem'
                          }}
                          disabled={saving}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: 'var(--border-radius)'
        }}>
          <div>
            <strong>Ready to submit:</strong> {getValidAssessments().length} assessment(s)
          </div>
          <button 
            className="button primary" 
            onClick={submitBatchAssessments}
            disabled={saving || getValidAssessments().length === 0}
            style={{ padding: '10px 20px' }}
          >
            {saving ? 'Submitting...' : 'Submit All Assessments'}
          </button>
        </div>

        {students.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No students found. Add students first to record assessments.
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchAssessmentForm;
