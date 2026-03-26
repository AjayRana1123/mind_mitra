import React, { useState, useEffect, useRef } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Send, 
  AlertTriangle, 
  Smile, 
  Meh, 
  Frown, 
  BarChart2, 
  Bot, 
  Mic, 
  LogOut, 
  MessageSquare, 
  Users, 
  Settings,
  Zap
} from 'lucide-react';

import Navbar from './Navbar';
import '../styles/Dashboard.css';

export default function Dashboard({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchHistory();
  }, [user.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/history/${user.uid}`);
      const history = response.data;
      
      const formattedMessages = [];
      history.forEach(item => {
        formattedMessages.push({
          id: `user-${item.timestamp}`,
          role: 'user',
          content: item.feeling,
          timestamp: item.timestamp
        });
        
        if (item.analysis) {
          formattedMessages.push({
            id: `ai-${item.timestamp}`,
            role: 'ai',
            content: item.analysis,
            timestamp: item.timestamp
          });
        }
      });
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageText = input;
    setInput('');
    
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/checkin`, {
        userId: user.uid,
        feeling: userMessageText
      });
      
      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        content: response.data.analysis,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Failed to submit check-in:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'ai',
        content: { sentiment: 'red', error: true, counselorMessage: "I'm having trouble connecting. Please try again later." },
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'green': return <Smile size={18} />;
      case 'amber': return <Meh size={18} />;
      case 'red': return <Frown size={18} />;
      default: return <Bot size={18} />;
    }
  };

  return (
    <>
      <Navbar user={user} />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="chat-container">
          <div className="messages-list">
            {messages.length === 0 && !isTyping && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
                <Bot size={64} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Hey {user.email?.split('@')[0] || "there"}! 💙</h3>
                <p>How are you feeling today? Take a moment — your feelings matter.</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                {msg.role === 'ai' && msg.content.sentiment && (
                  <div className={`sentiment-tag ${msg.content.sentiment}`}>
                    {getSentimentIcon(msg.content.sentiment)}
                    {msg.content.sentiment}
                  </div>
                )}
                <div className="bubble">
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="ai-response-content">
                      {msg.content.error ? (
                          <p>{msg.content.counselorMessage}</p>
                      ) : (
                          <>
                              <p style={{ marginBottom: '1rem' }}>I hear you. Here are some things that might help:</p>
                              <ul className="strategy-list" style={{ margin: 0, fontSize: '0.95rem' }}>
                                  {msg.content.copingStrategies?.map((strategy, idx) => (
                                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{strategy}</li>
                                  ))}
                              </ul>

                              {msg.content.highRiskDetected && msg.content.counselorMessage && (
                                  <div className="counselor-alert" style={{ marginTop: '1rem' }}>
                                      <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                                      <p style={{ fontSize: '0.85rem', margin: 0 }}>{msg.content.counselorMessage}</p>
                                  </div>
                              )}
                          </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message-wrapper ai">
                <div className="bubble">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <form className="chat-input-wrapper" onSubmit={handleSend}>
          <button 
            type="button" 
            className={`btn-icon ${isListening ? 'active' : ''}`} 
            onClick={startListening}
            title="Voice to Text"
          >
            <Mic size={20} />
          </button>
          <input 
            type="text"
            className="chat-input" 
            placeholder="Message MindMitra..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn-send-round"
            disabled={!input.trim() || loading}
          >
            <Send size={20} />
          </button>
        </form>
      </main>
    </>
  );
}