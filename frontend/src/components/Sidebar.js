import React from 'react';
import './Sidebar.css';

export default function Sidebar({ open, onClose, researchData, userContext, chatHistory }) {
  const stats = researchData?.retrievalStats;

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Research Panel</h2>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        {userContext?.disease && (
          <div className="sidebar-context-card">
            <div className="scc-label">Active Context</div>
            {userContext.patientName && <div className="scc-row"><span>👤</span><span>{userContext.patientName}</span></div>}
            {userContext.disease && <div className="scc-row"><span>🔬</span><span>{userContext.disease}</span></div>}
            {userContext.location && <div className="scc-row"><span>📍</span><span>{userContext.location}</span></div>}
          </div>
        )}

        {stats && (
          <div className="sidebar-stats">
            <h3>Last Retrieval</h3>
            <div className="stats-grid">
              <div className="stat-box"><div className="stat-val">{stats.totalPublicationsRetrieved || 0}</div><div className="stat-label">Publications</div></div>
              <div className="stat-box"><div className="stat-val">{stats.totalTrialsRetrieved || 0}</div><div className="stat-label">Trials</div></div>
              <div className="stat-box"><div className="stat-val">{stats.pubmedCount || 0}</div><div className="stat-label">PubMed</div></div>
              <div className="stat-box"><div className="stat-val">{stats.openAlexCount || 0}</div><div className="stat-label">OpenAlex</div></div>
            </div>
            {stats.processingTimeMs && <div className="stat-time">⚡ {(stats.processingTimeMs / 1000).toFixed(1)}s pipeline time</div>}
          </div>
        )}

        {researchData?.expandedQuery && (
          <div className="sidebar-query">
            <h3>Expanded Query</h3>
            <div className="query-pill">"{researchData.expandedQuery}"</div>
          </div>
        )}

        {researchData?.publications?.length > 0 && (
          <div className="sidebar-section">
            <h3>Top Publications <span>{researchData.publications.length}</span></h3>
            <div className="sidebar-pub-list">
              {researchData.publications.map((pub, i) => (
                <a key={i} href={pub.url} target="_blank" rel="noopener noreferrer" className="sidebar-pub-item">
                  <div className="spi-source">{pub.source} · {pub.year || 'N/A'}</div>
                  <div className="spi-title">{pub.title}</div>
                  {pub.authors?.[0] && <div className="spi-author">{pub.authors[0]}</div>}
                </a>
              ))}
            </div>
          </div>
        )}

        {researchData?.clinicalTrials?.length > 0 && (
          <div className="sidebar-section">
            <h3>Clinical Trials <span>{researchData.clinicalTrials.length}</span></h3>
            <div className="sidebar-pub-list">
              {researchData.clinicalTrials.map((trial, i) => (
                <a key={i} href={trial.url} target="_blank" rel="noopener noreferrer" className="sidebar-pub-item">
                  <div className="spi-source">
                    <span className={`mini-status ${trial.status?.toLowerCase()}`}>{trial.status}</span>
                    {trial.phase !== 'N/A' && ` · Phase ${trial.phase}`}
                  </div>
                  <div className="spi-title">{trial.title}</div>
                  {trial.nctId && <div className="spi-author">{trial.nctId}</div>}
                </a>
              ))}
            </div>
          </div>
        )}

        {!researchData && (
          <div className="sidebar-empty">
            <div className="empty-icon">🔬</div>
            <p>Research data will appear here after your first query</p>
          </div>
        )}
        {chatHistory?.length > 0 && (
          <div className="sidebar-section">
            <h3>Recent Chats</h3>
            <div className="recent-chat-list">
              {chatHistory.map(chat => (
                <div key={chat.id} className="recent-chat-item">
                  <div className="recent-chat-title">{chat.title}</div>
                  <div className="recent-chat-date">{chat.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-sources">
          <h3>Data Sources</h3>
          <div className="source-pills">
            <a href="https://pubmed.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer" className="source-pill pubmed">PubMed</a>
            <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="source-pill openalex">OpenAlex</a>
            <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" className="source-pill trials">ClinicalTrials.gov</a>
          </div>
        </div>
      </aside>
    </>
  );
}
