import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, Smile, Meh, Frown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  if (loading) {
    return <div className="loading-screen">Loading Analytics...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="glass-card dashboard-card" style={{ textAlign: 'center' }}>
        <h2>No Data Yet</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>Complete your first daily check-in to see your mood analytics.</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go Back</button>
      </div>
    );
  }

  // Calculate dominant emotion (mode)
  const emotionCounts = history.reduce((acc, curr) => {
    const sentiment = (curr.analysis?.sentiment || 'green').toLowerCase();
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {});

  const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b);

  // Check counseling criteria: Have there been 3 or more 'red' days in the last 7 entries?
  const recentEntries = history.slice(-7);
  const recentRedCount = recentEntries.filter(h => (h.analysis?.sentiment || '').toLowerCase() === 'red').length;
  const needsCounselor = recentRedCount >= 3;

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
      case 'green': return <Smile style={{ color: 'var(--green)' }} size={32} />;
      case 'amber': return <Meh style={{ color: 'var(--amber)' }} size={32} />;
      case 'red': return <Frown style={{ color: 'var(--red)' }} size={32} />;
      default: return null;
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#1E293B', padding: '1rem', border: '1px solid #334155', borderRadius: '0.5rem' }}>
          <p style={{ color: '#F8FAFC', fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            {data.dateStr} at {data.timeStr}
          </p>
          <p style={{ color: `var(--${data.sentiment})`, textTransform: 'capitalize', fontWeight: '600' }}>Mood: {data.sentiment}</p>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.5rem', maxWidth: '250px', whiteSpace: 'normal', fontStyle: 'italic' }}>"{data.feeling}"</p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const colors = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)' };
    const color = colors[payload.sentiment] || 'var(--primary)';
    return (
      <circle cx={cx} cy={cy} r={6} stroke="var(--bg)" strokeWidth={2} fill={color} />
    );
  };

  return (
    <div className="glass-card dashboard-card" style={{ width: '100%', maxWidth: '1200px' }}>
      <div className="header-row">
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={20} /> Back to Check-In
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Mood Analytics</h2>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '50%' }}>
            {getSentimentIcon(dominantEmotion)}
          </div>
          <div>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dominant Emotion</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize', color: `var(--${dominantEmotion})` }}>{dominantEmotion}</p>
          </div>
        </div>
        
        <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Check-ins</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{history.length}</p>
        </div>
      </div>

      {needsCounselor && (
        <div className="counselor-alert" style={{ marginBottom: '2rem' }}>
          <AlertCircle style={{ flexShrink: 0 }} size={24} />
          <div>
            <strong>Persistent Low Mood Detected</strong>
            <p style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>We've noticed you've been feeling down for several days recently. It might be very helpful to speak with a professional counselor to get support during this time.</p>
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '1rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>Mood Trend (Last 30 Entries)</h3>
        <div style={{ width: '100%', height: '300px' }}>
          <MarginlessContainer>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="uniqueId" tickFormatter={(val) => val.split(' ').slice(0, 2).join(' ')} stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 4]} ticks={[1, 2, 3]} tickFormatter={(val) => val === 1 ? 'Red' : val === 2 ? 'Amber' : val === 3 ? 'Green' : ''} stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={<CustomDot />} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </MarginlessContainer>
        </div>
      </div>
    </div>
  );
}

const MarginlessContainer = ({ children }) => (
  <div style={{ width: '100%', height: '100%', marginLeft: '-20px' }}>
    {children}
  </div>
);
