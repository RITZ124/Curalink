import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import UserContextModal from './components/UserContextModal';
import './App.css';

function App() {
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('curalink_session') || uuidv4();
  });
  const [userContext, setUserContext] = useState(() => {
    const saved = localStorage.getItem('curalink_context');
    return saved ? JSON.parse(saved) : {};
  });
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('curalink_chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentResearchData, setCurrentResearchData] = useState(null);

  useEffect(() => {
    localStorage.setItem('curalink_session', sessionId);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem('curalink_context', JSON.stringify(userContext));
  }, [userContext]);

  useEffect(() => {
    localStorage.setItem('curalink_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);
  const startNewSession = () => {
    if (messages.length > 0) {
      setChatHistory(prev => [
        {
          id: sessionId,
          title: messages[0]?.content?.slice(0, 50) || 'Medical Chat',
          date: new Date().toLocaleString()
        },
        ...prev.slice(0, 9)
      ]);
    }
    const newId = uuidv4();
    setSessionId(newId);
    setMessages([]);
    setCurrentResearchData(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span><span></span><span></span>
          </button>
          <div className="logo">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="url(#logoGrad)"/>
              <path d="M18 8 L18 28 M8 18 L28 18" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="5" fill="none" stroke="white" strokeWidth="2"/>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop stopColor="#0ea5e9"/>
                  <stop offset="1" stopColor="#6366f1"/>
                </linearGradient>
              </defs>
            </svg>
            <span>CuraLink</span>
            <span className="badge">AI Medical Research</span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-context" onClick={() => setShowModal(true)}>
            {userContext.patientName ? (
              <><span className="ctx-dot"></span>{userContext.patientName}</>
            ) : (
              '+ Set Patient Context'
            )}
          </button>
          <button className="btn-new" onClick={startNewSession}>New Chat</button>
        </div>
      </header>

      <div className="app-body">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          researchData={currentResearchData}
          userContext={userContext}
          chatHistory={chatHistory}
        />

        <main className="main-content" onClick={() => sidebarOpen && setSidebarOpen(false)}>
          <ChatInterface
            sessionId={sessionId}
            userContext={userContext}
            messages={messages}
            setMessages={setMessages}
            onResearchData={setCurrentResearchData}
          />
        </main>
      </div>

      {showModal && (
        <UserContextModal
          userContext={userContext}
          onSave={(ctx) => { setUserContext(ctx); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default App;
