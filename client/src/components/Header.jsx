import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, toggleSidebar } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <i className="ri-menu-line"></i>
        </button>
        <Link to="/" className="logo">
          <i className="ri-youtube-fill logo-icon"></i>
          YouTube
        </Link>
      </div>

      <div className="header-center">
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">
            <i className="ri-search-line"></i>
          </button>
        </form>
      </div>

      <div className="header-right">
        {user ? (
          <>
            <Link to={`/channel/${user.channels?.[0] || ''}`} className="user-btn">
              <img 
                src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
                alt={user.username} 
                className="user-avatar"
              />
              {user.username}
            </Link>
            <button className="user-btn" onClick={handleLogout}>
              <i className="ri-logout-box-r-line"></i>
              Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="user-btn">
            <i className="ri-user-line"></i>
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
