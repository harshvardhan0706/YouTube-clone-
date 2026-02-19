import express from 'express';
import Video from '../models/Video.js';
import Channel from '../models/Channel.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/videos
// @desc    Get all videos with optional search and filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    
    let query = {};

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Sort videos
    let sortOption = { uploadDate: -1 };
    if (sort === 'views') {
      sortOption = { views: -1 };
    } else if (sort === 'likes') {
      sortOption = { likes: -1 };
    } else if (sort === 'oldest') {
      sortOption = { uploadDate: 1 };
    }

    const videos = await Video.find(query)
      .populate('uploader', 'username avatar')
      .sort(sortOption);

    res.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/videos/:id
// @desc    Get single video by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'username avatar')
      .populate('channelId', 'channelName');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Increment views
    video.views += 1;
    await video.save();

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/videos
// @desc    Create a new video
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, thumbnailUrl, videoUrl, category, channelId } = req.body;

    // Verify channel belongs to user
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload to this channel' });
    }

    const video = await Video.create({
      title,
      description,
      thumbnailUrl,
      videoUrl,
      category,
      channelId,
      channelName: channel.channelName,
      uploader: req.user._id
    });

    // Add video to channel
    channel.videos.push(video._id);
    await channel.save();

    res.status(201).json(video);
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update a video
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, thumbnailUrl, videoUrl, category } = req.body;

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check ownership
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this video' });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (thumbnailUrl) video.thumbnailUrl = thumbnailUrl;
    if (videoUrl) video.videoUrl = videoUrl;
    if (category) video.category = category;

    const updatedVideo = await video.save();
    res.json(updatedVideo);
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check ownership
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    // Remove video from channel
    await Channel.updateOne(
      { _id: video.channelId },
      { $pull: { videos: video._id } }
    );

    await video.deleteOne();
    res.json({ message: 'Video deleted' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/videos/:id/like
// @desc    Like/dislike a video
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userId = req.user._id;
    const { action } = req.body; // 'like', 'dislike', or 'unlike', 'undislike'

    // Check if already liked/disliked
    const alreadyLiked = video.likedBy.includes(userId);
    const alreadyDisliked = video.dislikedBy.includes(userId);

    if (action === 'like') {
      if (alreadyLiked) {
        // Unlike
        video.likes -= 1;
        video.likedBy = video.likedBy.filter(id => id.toString() !== userId.toString());
      } else {
        // Like
        video.likes += 1;
        video.likedBy.push(userId);
        // Remove from disliked if exists
        if (alreadyDisliked) {
          video.dislikes -= 1;
          video.dislikedBy = video.dislikedBy.filter(id => id.toString() !== userId.toString());
        }
      }
    } else if (action === 'dislike') {
      if (alreadyDisliked) {
        // Undislike
        video.dislikes -= 1;
        video.dislikedBy = video.dislikedBy.filter(id => id.toString() !== userId.toString());
      } else {
        // Dislike
        video.dislikes += 1;
        video.dislikedBy.push(userId);
        // Remove from liked if exists
        if (alreadyLiked) {
          video.likes -= 1;
          video.likedBy = video.likedBy.filter(id => id.toString() !== userId.toString());
        }
      }
    }

    await video.save();

    res.json({
      likes: video.likes,
      dislikes: video.dislikes,
      likedBy: video.likedBy,
      dislikedBy: video.dislikedBy
    });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/videos/channel/:channelId
// @desc    Get videos by channel
// @access  Public
router.get('/channel/:channelId', async (req, res) => {
  try {
    const videos = await Video.find({ channelId: req.params.channelId })
      .populate('uploader', 'username avatar')
      .sort({ uploadDate: -1 });

    res.json(videos);
  } catch (error) {
    console.error('Get channel videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
