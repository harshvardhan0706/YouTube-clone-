import { Link } from 'react-router-dom';

const VideoCard = ({ video }) => {
  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatDate = (date) => {
    const uploadDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - uploadDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      return `${Math.floor(diffDays / 365)} years ago`;
    } else if (diffDays > 30) {
      return `${Math.floor(diffDays / 30)} months ago`;
    } else if (diffDays > 7) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else if (diffDays > 1) {
      return `${diffDays} days ago`;
    }
    return 'Today';
  };

  return (
    <Link to={`/video/${video._id}`} className="video-card">
      <div className="video-thumbnail">
        <img 
          src={video.thumbnailUrl || 'https://via.placeholder.com/640x360'} 
          alt={video.title}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/640x360?text=No+Thumbnail';
          }}
        />
        <span className="video-duration">10:00</span>
      </div>
      <div className="video-info">
        <img 
          src={video.channelId?.channelBanner || 'https://api.dicebear.com/7.x/shapes/svg?seed=channel'} 
          alt={video.channelName}
          className="video-channel-icon"
          onError={(e) => {
            e.target.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=channel';
          }}
        />
        <div className="video-details">
          <h3 className="video-title">{video.title}</h3>
          <div className="video-meta">
            <Link to={`/channel/${video.channelId?._id || ''}`}>
              {video.channelName || 'Unknown Channel'}
            </Link>
            <br />
            {formatViews(video.views)} • {formatDate(video.uploadDate)}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
