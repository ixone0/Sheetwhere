import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FilterModal.css';

const FilterModal = ({ isOpen, onClose, onApplyFilter }) => {
  const [subjects, setSubjects] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/home/subjects');
        setSubjects(response.data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  const handleSubjectClick = (subjectCode) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectCode)) {
        return prev.filter((code) => code !== subjectCode);
      }
      return [...prev, subjectCode];
    });
  };

  const handleApplyFilter = () => {
    onApplyFilter({ subjects: selectedSubjects, term: selectedTerm });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal">
        <div className="filter-modal-header">
          <h2>Filter</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="terms-container">
          {Object.keys(subjects).map((term) => (
            <div
              key={term}
              className={`term ${selectedTerm === parseInt(term) ? 'selected' : ''}`}
              onClick={() => setSelectedTerm(parseInt(term))}
            >
              Term {term}
            </div>
          ))}
        </div>

        <div className="subjects-container">
          {Object.entries(subjects).map(([term, termSubjects]) => (
            <div key={term} className={selectedTerm === parseInt(term) ? 'visible' : 'hidden'}>
              {termSubjects.map((subject) => (
                <div
                  key={subject.code}
                  className={`subject-tag ${selectedSubjects.includes(subject.code) ? 'selected' : ''}`}
                  onClick={() => handleSubjectClick(subject.code)}
                >
                  {subject.code}
                </div>
              ))}
            </div>
          ))}
        </div>

        <button className="apply-filter-button" onClick={handleApplyFilter}>
          Apply filter
        </button>
      </div>
    </div>
  );
};

export default FilterModal;