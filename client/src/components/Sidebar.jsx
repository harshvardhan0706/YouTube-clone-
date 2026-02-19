import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { sidebarOpen } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
      <div className="sidebar-section">
        <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
          <i className="ri-home-line"></i>
          Home
        </Link>
        <Link to="/?sort=views" className="sidebar-link">
          <i className="ri-fire-line"></i>
          Trending
        </Link>
        <Link to="/?sort=likes" className="sidebar-link">
          <i className="ri-movie-line"></i>
          Subscriptions
        </Link>
      </div>

      <div className="sidebar-section">
        <Link to="/" className="sidebar-link">
          <i className="ri-collection-line"></i>
          Library
        </Link>
        <Link to="/" className="sidebar-link">
          <i className="ri-history-line"></i>
          History
        </Link>
        <Link to="/" className="sidebar-link">
          <i className="ri-time-line"></i>
          Watch Later
        </Link>
        <Link to="/" className="sidebar-link">
          <i className="ri-heart-line"></i>
          Liked Videos
        </Link>
      </div>

      <div className="sidebar-section">
        <h3 style={{ padding: '8px 12px', fontSize: '16px', fontWeight: '500' }}>Explore</h3>
        <Link to="/?category=Music" className="sidebar-link">
          <i className="ri-music-line"></i>
          Music
        </Link>
        <Link to="/?category=Gaming" className="sidebar-link">
          <i className="ri-gamepad-line"></i>
          Gaming
        </Link>
        <Link to="/?category=Technology" className="sidebar-link">
          <i className="ri-computer-line"></i>
          Technology
        </Link>
        <Link to="/?category=Education" className="sidebar-link">
          <i className="ri-book-open-line"></i>
          Education
        </Link>
        <Link to="/?category=Sports" className="sidebar-link">
          <i className="ri-basketball-line"></i>
          Sports
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
