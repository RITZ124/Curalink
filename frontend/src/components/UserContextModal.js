import React, { useState } from 'react';
import './UserContextModal.css';

export default function UserContextModal({ userContext, onSave, onClose }) {
  const [form, setForm] = useState({
    patientName: userContext.patientName || '',
    disease: userContext.disease || '',
    location: userContext.location || '',
    additionalContext: userContext.additionalContext || ''
  });

  const handle = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const COMMON_CONDITIONS = [
    "Lung Cancer", "Breast Cancer", "Parkinson's Disease", "Alzheimer's Disease",
    "Diabetes", "Heart Disease", "Hypertension", "Depression",
    "Multiple Sclerosis", "Arthritis", "Stroke", "COVID-19", "Epilepsy"
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Patient Context</h2>
            <p>Set context for personalized research results</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Patient Name <span className="optional">(optional)</span></label>
            <input type="text" placeholder="e.g. John Smith" value={form.patientName} onChange={handle('patientName')} />
          </div>

          <div className="form-group">
            <label>Disease / Condition <span className="required">*</span></label>
            <input type="text" placeholder="e.g. Parkinson's Disease, Lung Cancer..." value={form.disease} onChange={handle('disease')} />
            <div className="quick-conditions">
              {COMMON_CONDITIONS.map(c => (
                <button
                  key={c}
                  className={`condition-chip ${form.disease === c ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, disease: c }))}
                >{c}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Location <span className="optional">(for trial matching)</span></label>
            <input type="text" placeholder="e.g. Toronto, Canada" value={form.location} onChange={handle('location')} />
          </div>

          <div className="form-group">
            <label>Additional Context <span className="optional">(optional)</span></label>
            <textarea placeholder="e.g. Stage 3, post-surgery, interested in immunotherapy..." value={form.additionalContext} onChange={handle('additionalContext')} rows={3} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={() => onSave(form)} disabled={!form.disease.trim()}>
            Save Context
          </button>
        </div>
      </div>
    </div>
  );
}
