import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

const CATEGORIES = ['Programming', 'Music', 'Gaming', 'Education', 'Entertainment', 'Sports', 'Technology', 'News', 'Travel', 'Food'];

const Channel = () => {
  const { id } = useParams();
  const { user, sidebarOpen, updateUser } = useAuth();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  
  // Create channel form
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  
  // Upload/Edit video form
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCategory, setVideoCategory] = useState('Programming');

  useEffect(() => {
    if (id) {
      fetchChannel();
    } else if (user) {
      // If no id but user exists, show their channels
      fetchUserChannels();
    }
  }, [id, user]);

  const fetchChannel = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/channels/${id}`);
      setChannel(response.data.channel);
      setVideos(response.data.videos);
    } catch (err) {
      console.error('Error fetching channel:', err);
      setError('Channel not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChannels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/channels/user/${user._id}`);
      if (response.data.length > 0) {
        setChannel(response.data[0]);
        // Fetch videos for this channel
        const videosResponse = await axios.get(`/api/videos/channel/${response.data[0]._id}`);
        setVideos(videosResponse.data);
      }
    } catch (err) {
      console.error('Error fetching user channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      const response = await axios.post('/api/channels', {
        channelName,
        description: channelDescription
      });
      setChannel(response.data);
      // Update user's channels in context
      updateUser({ ...user, channels: [...(user.channels || []), response.data._id] });
      setShowCreateModal(false);
      setChannelName('');
      setChannelDescription('');
    } catch (err) {
      console.error('Error creating channel:', err);
      setError(err.response?.data?.message || 'Failed to create channel');
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoUrl.trim()) {
      setError('Title and video URL are required');
      return;
    }

    try {
      const response = await axios.post('/api/videos', {
        title: videoTitle,
        description: videoDescription,
        thumbnailUrl: videoThumbnail || 'https://via.placeholder.com/640x360',
        videoUrl,
        category: videoCategory,
        channelId: channel._id
      });
      setVideos([response.data, ...videos]);
      setShowUploadModal(false);
      resetVideoForm();
    } catch (err) {
      console.error('Error uploading video:', err);
      // Demo mode - add locally
      const localVideo = {
        _id: `local-${Date.now()}`,
        title: videoTitle,
        description: videoDescription,
        thumbnailUrl: videoThumbnail || 'https://via.placeholder.com/640x360',
        videoUrl,
        category: videoCategory,
        channelId: channel._id,
        channelName: channel.channelName,
        views: 0,
        likes: 0,
        dislikes: 0,
        uploadDate: new Date().toISOString()
      };
      setVideos([localVideo, ...videos]);
      setShowUploadModal(false);
      resetVideoForm();
    }
  };

  const handleEditVideo = async (e) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const response = await axios.put(`/api/videos/${editingVideo._id}`, {
        title: videoTitle,
        description: videoDescription,
        thumbnailUrl: videoThumbnail,
        category: videoCategory
      });
      setVideos(videos.map(v => v._id === editingVideo._id ? response.data : v));
      setShowEditModal(false);
      setEditingVideo(null);
      resetVideoForm();
    } catch (err) {
      console.error('Error updating video:', err);
      // Demo mode
      setVideos(videos.map(v => v._id === editingVideo._id ? {
        ...v,
        title: videoTitle,
        description: videoDescription,
        thumbnailUrl: videoThumbnail,
        category: videoCategory
      } : v));
      setShowEditModal(false);
      setEditingVideo(null);
      resetVideoForm();
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await axios.delete(`/api/videos/${videoId}`);
      setVideos(videos.filter(v => v._id !== videoId));
    } catch (err) {
      console.error('Error deleting video:', err);
      // Demo mode
      setVideos(videos.filter(v => v._id !== videoId));
    }
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setVideoTitle(video.title);
    setVideoDescription(video.description || '');
    setVideoThumbnail(video.thumbnailUrl || '');
    setVideoCategory(video.category || 'Programming');
    setShowEditModal(true);
  };

  const resetVideoForm = () => {
    setVideoTitle('');
    setVideoDescription('');
    setVideoThumbnail('');
    setVideoUrl('');
    setVideoCategory('Programming');
  };

  const isOwner = user && channel && user._id === channel.owner?._id;

  if (loading) {
    return (
      <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // If user is logged in but has no channel, show create channel option
  if (user && !channel) {
    return (
      <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>Create Your Channel</h2>
          <p style={{ marginBottom: '20px', color: '#606060' }}>
            Start uploading videos and building your audience
          </p>
          <button 
            className="btn-primary" 
            style={{ maxWidth: '200px' }}
            onClick={() => setShowCreateModal(true)}
          >
            Create Channel
          </button>
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">Create Channel</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              
              {error && <div className="error-message">{error}</div>}
              
              <form onSubmit={handleCreateChannel}>
                <div className="form-group">
                  <label className="form-label">Channel Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Enter channel name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={channelDescription}
                    onChange={(e) => setChannelDescription(e.target.value)}
                    placeholder="Describe your channel"
                    rows="3"
                  />
                </div>
                
                <button type="submit" className="btn-primary">Create Channel</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!channel) {
    return (
      <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div className="error-message">Channel not found</div>
      </div>
    );
  }

  return (
    <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
      <div className="channel-header">
        <div className="channel-banner">
          <img 
            src={channel.channelBanner || 'https://via.placeholder.com/1280x200?text=Channel+Banner'} 
            alt={channel.channelName}
          />
        </div>
        
        <div className="channel-info-section">
          <img 
            src={channel.channelBanner || 'https://api.dicebear.com/7.x/shapes/svg?seed=channel'} 
            alt={channel.channelName}
            className="channel-info-avatar"
          />
          
          <div className="channel-info-details">
            <h1 className="channel-info-name">{channel.channelName}</h1>
            <p className="channel-info-stats">
              {channel.subscribers?.toLocaleString() || '0'} subscribers • {videos.length} videos
            </p>
            {channel.description && (
              <p style={{ fontSize: '14px', color: '#606060', marginTop: '4px' }}>
                {channel.description}
              </p>
            )}
          </div>
          
          <div className="channel-actions">
            {isOwner && (
              <>
                <button 
                  className="channel-action-btn primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  Upload Video
                </button>
                <button className="channel-action-btn secondary">
                  Edit Channel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No videos yet</h3>
          {isOwner && <p>Upload your first video to get started</p>}
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div key={video._id} style={{ position: 'relative' }}>
              <VideoCard video={video} />
              {isOwner && (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  padding: '8px 0',
                  position: 'absolute',
                  top: '8px',
                  right: '8px'
                }}>
                  <button 
                    className="action-btn"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => openEditModal(video)}
                  >
                    Edit
                  </button>
                  <button 
                    className="action-btn"
                    style={{ padding: '4px 8px', fontSize: '12px', color: '#cc0000' }}
                    onClick={() => handleDeleteVideo(video._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Upload Video</h2>
            <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            
            <form onSubmit={handleUploadVideo}>
              <div className="form-group">
                <label className="form-label">Video Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter video title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Describe your video"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Video URL *</label>
                <input
                  type="url"
                  className="form-input"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Thumbnail URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={videoThumbnail}
                  onChange={(e) => setVideoThumbnail(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={videoCategory}
                  onChange={(e) => setVideoCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="btn-primary">Upload</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Edit Video</h2>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            
            <form onSubmit={handleEditVideo}>
              <div className="form-group">
                <label className="form-label">Video Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Thumbnail URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={videoThumbnail}
                  onChange={(e) => setVideoThumbnail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={videoCategory}
                  onChange={(e) => setVideoCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="btn-primary">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;
