import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Thumbnail URL is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Programming', 'Music', 'Gaming', 'Education', 'Entertainment', 'Sports', 'Technology', 'News', 'Travel', 'Food']
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for search
videoSchema.index({ title: 'text', description: 'text' });

const Video = mongoose.model('Video', videoSchema);

export default Video;
