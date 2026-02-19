import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const VideoPlayer = () => {
  const { id } = useParams();
  const { user, sidebarOpen } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchVideo();
    fetchComments();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await axios.get(`/api/videos/${id}`);
      setVideo(response.data);
      
      // Check if user has liked/disliked
      if (user) {
        setLiked(response.data.likedBy?.includes(user._id));
        setDisliked(response.data.dislikedBy?.includes(user._id));
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      // Sample data
      setVideo(getSampleVideo(id));
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/comments/video/${id}`);
      setComments(response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments(getSampleComments());
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const action = liked ? 'unlike' : 'like';
      const response = await axios.put(`/api/videos/${id}/like`, { action });
      setVideo({ ...video, ...response.data });
      setLiked(!liked);
      if (disliked) setDisliked(false);
    } catch (err) {
      console.error('Error liking video:', err);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      const action = disliked ? 'undislike' : 'dislike';
      const response = await axios.put(`/api/videos/${id}/like`, { action });
      setVideo({ ...video, ...response.data });
      setDisliked(!disliked);
      if (liked) setLiked(false);
    } catch (err) {
      console.error('Error disliking video:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newComment.trim()) return;

    try {
      const response = await axios.post('/api/comments', {
        videoId: id,
        text: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      // Add locally for demo
      const localComment = {
        _id: `local-${Date.now()}`,
        videoId: id,
        userId: user._id,
        username: user.username,
        userAvatar: user.avatar,
        text: newComment,
        createdAt: new Date().toISOString()
      };
      setComments([localComment, ...comments]);
      setNewComment('');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setComments(comments.filter(c => c._id !== commentId));
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment._id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (commentId) => {
    try {
      const response = await axios.put(`/api/comments/${commentId}`, { text: editText });
      setComments(comments.map(c => c._id === commentId ? response.data : c));
      setEditingComment(null);
      setEditText('');
    } catch (err) {
      console.error('Error updating comment:', err);
      setComments(comments.map(c => c._id === commentId ? { ...c, text: editText } : c));
      setEditingComment(null);
      setEditText('');
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffTime = Math.abs(now - commentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) return `${Math.floor(diffDays / 365)} years ago`;
    if (diffDays > 30) return `${Math.floor(diffDays / 30)} months ago`;
    if (diffDays > 7) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays > 1) return `${diffDays} days ago`;
    return 'Today';
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

  if (!video) {
    return (
      <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div className="error-message">Video not found</div>
      </div>
    );
  }

  return (
    <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
      <div className="video-player-container">
        <div className="video-player-wrapper">
          <video 
            src={video.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'} 
            controls 
            autoPlay
          />
        </div>

        <h1 className="video-player-title">{video.title}</h1>
        
        <div className="video-player-stats">
          <span className="video-player-views">
            {formatViews(video.views)} views • {formatDate(video.uploadDate)}
          </span>
          
          <div className="video-player-actions">
            <button 
              className={`action-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={!user}
            >
              <i className="ri-thumb-up-line"></i>
              {formatViews(video.likes)}
            </button>
            <button 
              className={`action-btn ${disliked ? 'disliked' : ''}`}
              onClick={handleDislike}
              disabled={!user}
            >
              <i className="ri-thumb-down-line"></i>
              {formatViews(video.dislikes)}
            </button>
            <button className="action-btn">
              <i className="ri-share-forward-line"></i>
              Share
            </button>
          </div>
        </div>

        <div className="video-channel-info">
          <div className="channel-info">
            <img 
              src={video.channelId?.channelBanner || 'https://api.dicebear.com/7.x/shapes/svg?seed=channel'} 
              alt={video.channelName}
              className="channel-avatar"
            />
            <div>
              <h3 className="channel-name">{video.channelName}</h3>
              <span className="channel-subscribers">1.2M subscribers</span>
            </div>
          </div>
          <button className="subscribe-btn">Subscribe</button>
        </div>

        <div className="video-description">
          {video.description || 'No description available.'}
        </div>

        <div className="comments-section">
          <h3 className="comments-header">{comments.length} Comments</h3>
          
          {user ? (
            <form className="comment-form" onSubmit={handleAddComment}>
              <img 
                src={user.avatar} 
                alt={user.username}
                className="comment-avatar"
              />
              <div style={{ flex: 1 }}>
                <textarea
                  className="comment-input"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="2"
                />
                <div className="comment-actions">
                  <button type="button" className="comment-btn cancel" onClick={() => setNewComment('')}>
                    Cancel
                  </button>
                  <button type="submit" className="comment-btn submit">
                    Comment
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <p style={{ marginBottom: '16px' }}>
              <Link to="/login">Sign in</Link> to comment
            </p>
          )}

          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <img 
                  src={comment.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=comment'} 
                  alt={comment.username}
                  className="comment-avatar"
                />
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">{comment.username}</span>
                    <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  
                  {editingComment === comment._id ? (
                    <div>
                      <textarea
                        className="comment-input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows="2"
                      />
                      <div className="comment-actions">
                        <button className="comment-btn cancel" onClick={() => setEditingComment(null)}>
                          Cancel
                        </button>
                        <button className="comment-btn submit" onClick={() => handleSaveEdit(comment._id)}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="comment-text">{comment.text}</p>
                      {user && user._id === comment.userId && (
                        <div className="comment-actions-btns">
                          <button 
                            className="comment-action-btn"
                            onClick={() => handleEditComment(comment)}
                          >
                            Edit
                          </button>
                          <button 
                            className="comment-action-btn"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const getSampleVideo = (id) => ({
  _id: id,
  title: 'Learn React in 30 Minutes',
  description: 'A quick tutorial to get started with React. Learn the basics of React including components, state, props, and hooks.',
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  thumbnailUrl: 'https://i.ytimg.com/vi/Ke90Tje7VS0/maxresdefault.jpg',
  channelId: { _id: 'channel01', channelName: 'Code with John' },
  channelName: 'Code with John',
  views: 15200,
  likes: 1023,
  dislikes: 45,
  uploadDate: '2024-09-20',
  category: 'Programming',
  likedBy: [],
  dislikedBy: []
});

const getSampleComments = () => [
  {
    _id: 'comment01',
    videoId: 'video01',
    userId: 'user02',
    username: 'JohnDoe',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    text: 'Great video! Very helpful.',
    createdAt: '2024-09-21T08:30:00Z'
  },
  {
    _id: 'comment02',
    videoId: 'video01',
    userId: 'user03',
    username: 'JaneSmith',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    text: 'Thanks for explaining this so clearly!',
    createdAt: '2024-09-22T10:15:00Z'
  }
];

export default VideoPlayer;
