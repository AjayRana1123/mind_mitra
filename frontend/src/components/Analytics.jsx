import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, Smile, Meh, Frown, BarChart2, Zap, LogOut, MessageSquare, Settings, Users } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import Navbar from './Navbar';
import '../styles/Analytics.css';

export default function Analytics({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/history/${user.uid}`);
        setHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.uid]);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  if (loading) {
    return <div className="loading-screen">Loading Analytics...</div>;
  }

  // Calculate dominant emotion (mode)
  const emotionCounts = history.reduce((acc, curr) => {
    const sentiment = (curr.analysis?.sentiment || 'green').toLowerCase();
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {});

  const dominantEmotion = history.length > 0 
    ? Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b)
    : 'none';

  // Counselor suggestion logic: 3 or more red days in the last 7 check-ins
  const recentEntries = history.slice(-7);
  const redCount = recentEntries.filter(h => (h.analysis?.sentiment || '').toLowerCase() === 'red').length;
  const showCounselorPrompt = redCount >= 3;

  // Prepare chart data
  const sentimentScore = { "green": 3, "amber": 2, "red": 1 };
  const chartData = history.map((h, i) => {
    const d = new Date(h.timestamp);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const sentiment = (h.analysis?.sentiment || 'green').toLowerCase();
    return {
      uniqueId: `${dateStr} ${timeStr} ${i}`,
      dateStr: dateStr,
      timeStr: timeStr,
      score: sentimentScore[sentiment] || 3,
      sentiment: sentiment,
      feeling: h.feeling
    };
  });

  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'green': return <Smile style={{ color: '#3fb950' }} size={24} />;
      case 'amber': return <Meh style={{ color: '#d29922' }} size={24} />;
      case 'red': return <Frown style={{ color: '#f85149' }} size={24} />;
      default: return null;
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: 'var(--card-bg)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
          <p style={{ color: 'var(--text)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
            {data.dateStr} • {data.timeStr}
          </p>
          <p style={{ color: `var(--${data.sentiment})`, textTransform: 'capitalize', fontWeight: '700', fontSize: '1rem' }}>{data.sentiment} Mood</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '200px', lineHeight: '1.4' }}>"{data.feeling}"</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Navbar user={user} />

      <main className="dashboard-main" style={{ overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mood Analytics</h1>
            <button 
                onClick={() => navigate('/dashboard')}
                className="nav-link" 
                style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem' }}
            >
              <ArrowLeft size={18} /> Back to Chat
            </button>
          </div>

          {showCounselorPrompt && (
            <div className="counselor-alert" style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(248, 81, 73, 0.2)', backgroundColor: 'rgba(248, 81, 73, 0.05)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <AlertCircle size={24} color="#f85149" style={{ flexShrink: 0 }} />
                <div>
                  <h3 style={{ color: '#f85149', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Caring for Your Well-being</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                    We've noticed you've been feeling low for several days recently ({redCount} red entries in your last 7 check-ins). 
                    Your feelings are valid, and it might be very helpful to speak with a professional counselor to get additional support during this time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '4rem', textAlign: 'center' }}>
              <BarChart2 size={64} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
              <h3>No data to visualize yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Complete a few check-ins so MindMitra can start tracking your trends.</p>
              <button className="btn-send-round" style={{ width: 'auto', padding: '0.75rem 2rem', borderRadius: '2rem' }} onClick={() => navigate('/dashboard')}>Start Chatting</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1.25rem' }}>
                  <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Dominant Mood</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {getSentimentIcon(dominantEmotion)}
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, textTransform: 'capitalize', color: `var(--${dominantEmotion})` }}>{dominantEmotion}</span>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1.25rem' }}>
                  <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Total Check-ins</h3>
                  <span style={{ fontSize: '2rem', fontWeight: 700 }}>{history.length}</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1.25rem' }}>
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Last Entry</h3>
                    <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{new Date(history[history.length - 1].timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1.5rem' }}>
                <h3 style={{ marginBottom: '2rem', fontSize: '1.1rem', fontWeight: 600 }}>Emotional Journey</h3>
                <div style={{ width: '100%', height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="uniqueId" 
                        tickFormatter={(val) => val.split(' ').slice(0, 2).join(' ')} 
                        stroke="var(--text-muted)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                      />
                      <YAxis 
                        domain={[0.5, 3.5]} 
                        ticks={[1, 2, 3]} 
                        tickFormatter={(val) => val === 1 ? 'Red' : val === 2 ? 'Amber' : val === 3 ? 'Green' : ''} 
                        stroke="var(--text-muted)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#818CF8" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#818CF8', strokeWidth: 2, stroke: 'var(--bg)' }} 
                        activeDot={{ r: 7, fill: '#A855F7', stroke: 'white', strokeWidth: 2 }} 
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
