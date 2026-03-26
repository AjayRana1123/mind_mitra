import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { 
  Zap, 
  BarChart2, 
  MessageSquare, 
  LogOut 
} from 'lucide-react';
import '../styles/Navbar.css';

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <div style={{ color: '#818CF8' }}><Zap size={24} fill="#818CF8" /></div>
        <span className="logo-text">MindMitra</span>
      </div>
      
      <div className="nav-center">
        <button 
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} 
          onClick={() => navigate('/dashboard')}
        >
          <MessageSquare size={18} /> Chat
        </button>
        <button 
          className={`nav-link ${isActive('/analytics') ? 'active' : 'analytics'}`} 
          onClick={() => navigate('/analytics')}
        >
          <BarChart2 size={18} /> Analytics
        </button>
      </div>

      <div className="nav-right">
        <div className="user-profile">
          <span>{user?.email?.split('@')[0] || "User"}</span>
          <div className="avatar">{user?.email?.[0].toUpperCase() || "U"}</div>
        </div>
        <button className="btn-icon" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
