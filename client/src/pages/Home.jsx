import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All', 'Programming', 'Music', 'Gaming', 'Education', 
  'Entertainment', 'Sports', 'Technology', 'News', 'Travel', 'Food'
];

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { sidebarOpen } = useAuth();

  const currentCategory = searchParams.get('category') || 'All';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || '';

  useEffect(() => {
    fetchVideos();
  }, [currentCategory, currentSearch, currentSort]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentCategory !== 'All') params.append('category', currentCategory);
      if (currentSearch) params.append('search', currentSearch);
      if (currentSort) params.append('sort', currentSort);

      const response = await axios.get(`/api/videos?${params.toString()}`);
      setVideos(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos');
      // Add sample data for demonstration
      setVideos(getSampleVideos());
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    const params = new URLSearchParams(searchParams);
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    setSearchParams(params);
  };

  if (loading) {
    return (
      <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
      {error && <div className="error-message">{error}</div>}

      <div className="filter-container">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            className={`filter-btn ${currentCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No videos found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

// Sample videos for demonstration
const getSampleVideos = () => [
  {
    _id: 'video01',
    title: 'Learn React in 30 Minutes',
    thumbnailUrl: 'https://i.ytimg.com/vi/Ke90Tje7VS0/maxresdefault.jpg',
    description: 'A quick tutorial to get started with React.',
    channelId: { _id: 'channel01', channelName: 'Code with John' },
    channelName: 'Code with John',
    views: 15200,
    likes: 1023,
    dislikes: 45,
    uploadDate: '2024-09-20',
    category: 'Programming'
  },
  {
    _id: 'video02',
    title: 'JavaScript Fundamentals',
    thumbnailUrl: 'https://i.ytimg.com/vi/W6NZfCO5SIk/maxresdefault.jpg',
    description: 'Master JavaScript from scratch.',
    channelId: { _id: 'channel01', channelName: 'Code with John' },
    channelName: 'Code with John',
    views: 25000,
    likes: 1500,
    dislikes: 30,
    uploadDate: '2024-09-15',
    category: 'Programming'
  },
  {
    _id: 'video03',
    title: 'CSS Crash Course',
    thumbnailUrl: 'https://i.ytimg.com/vi/yfoY53QXEnI/maxresdefault.jpg',
    description: 'Learn CSS in one hour.',
    channelId: { _id: 'channel02', channelName: 'Web Dev Simplified' },
    channelName: 'Web Dev Simplified',
    views: 18000,
    likes: 900,
    dislikes: 20,
    uploadDate: '2024-09-10',
    category: 'Programming'
  },
  {
    _id: 'video04',
    title: 'Node.js Tutorial',
    thumbnailUrl: 'https://i.ytimg.com/vi/Oe421EPjeBE/maxresdefault.jpg',
    description: 'Build server-side applications.',
    channelId: { _id: 'channel01', channelName: 'Code with John' },
    channelName: 'Code with John',
    views: 22000,
    likes: 1200,
    dislikes: 40,
    uploadDate: '2024-09-05',
    category: 'Programming'
  },
  {
    _id: 'video05',
    title: 'MongoDB Complete Guide',
    thumbnailUrl: 'https://i.ytimg.com/vi/c2M-rlkkT5o/maxresdefault.jpg',
    description: 'Everything you need to know about MongoDB.',
    channelId: { _id: 'channel03', channelName: 'Programming with Mosh' },
    channelName: 'Programming with Mosh',
    views: 30000,
    likes: 2000,
    dislikes: 50,
    uploadDate: '2024-08-28',
    category: 'Programming'
  },
  {
    _id: 'video06',
    title: 'Music for Coding',
    thumbnailUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
    description: 'Lo-fi beats to code to.',
    channelId: { _id: 'channel04', channelName: 'Lofi Girl' },
    channelName: 'Lofi Girl',
    views: 50000,
    likes: 3000,
    dislikes: 100,
    uploadDate: '2024-08-20',
    category: 'Music'
  }
];

export default Home;
