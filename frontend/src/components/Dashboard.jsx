import React, { useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Heart, AlertTriangle, Smile, Meh, Frown, BarChart2 } from 'lucide-react';

export default function Dashboard({ user }) {
  const [feeling, setFeeling] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feeling.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/checkin`, {
        userId: user.uid,
        feeling: feeling
      });
      setFeedback(response.data.analysis);
      setFeeling('');
    } catch (error) {
      console.error("Failed to submit check-in:", error);
      alert("Error submitting your response. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'green': return <Smile size={24} />;
      case 'amber': return <Meh size={24} />;
      case 'red': return <Frown size={24} />;
      default: return <Heart size={24} />;
    }
  };

  return (
    <div className="glass-card dashboard-card">
      <div className="header-row">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Welcome, {user.email?.split('@')[0] || "User"}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Daily Check-In</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Log Out</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.75rem' }}>How are you feeling today?</label>
          <textarea 
            className="input-field" 
            placeholder="Share your thoughts, feelings, or whatever is on your mind..."
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn-primary" 
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          disabled={loading || !feeling.trim()}
        >
          {loading ? 'Analyzing...' : <>Submit Check-In <Send size={18} /></>}
        </button>
      </form>

      {feedback && (
        <div className={`feedback-box sentiment-${feedback.sentiment}`}>
          <div className="feedback-title">
            {getSentimentIcon(feedback.sentiment)}
            {feedback.sentiment} Sentiment
          </div>
          
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Here are some actionable strategies for you today:</p>
          
          <ul className="strategy-list">
            {feedback.copingStrategies?.map((strategy, idx) => (
              <li key={idx}>{strategy}</li>
            ))}
          </ul>

          {feedback.highRiskDetected && feedback.counselorMessage && (
             <div className="counselor-alert">
              <AlertTriangle style={{ flexShrink: 0 }} />
              <div>
                <strong>Professional Support Recommended</strong>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>{feedback.counselorMessage}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          onClick={() => navigate('/analytics')}
          className="btn-primary" 
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 1.5rem' }}
        >
          <BarChart2 size={18} /> View Analytics Dashboard
        </button>
      </div>
    </div>
  );
}
