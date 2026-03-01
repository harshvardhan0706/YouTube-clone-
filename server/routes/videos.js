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

    // If no videos in DB, return demo videos
    if (videos.length === 0) {
      return res.json(getDemoVideos(category));
    }

    res.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    // Return demo videos on error (demo mode)
    res.json(getDemoVideos(req.query.category));
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
      // Return demo video if not found
      const demoVideos = getDemoVideos();
      const demoVideo = demoVideos.find(v => v._id === req.params.id);
      if (demoVideo) {
        return res.json(demoVideo);
      }
      return res.status(404).json({ message: 'Video not found' });
    }

    // Increment views
    video.views += 1;
    await video.save();

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    // Return demo video on error
    const demoVideos = getDemoVideos();
    const demoVideo = demoVideos.find(v => v._id === req.params.id);
    if (demoVideo) {
      return res.json(demoVideo);
    }
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
    res.json([]);
  }
});

// Demo videos for demonstration mode
const getDemoVideos = (category) => {
  const demoVideos = [
    {
      _id: 'video01',
      title: 'Learn React in 30 Minutes',
      thumbnailUrl: 'https://i.ytimg.com/vi/Ke90Tje7VS0/maxresdefault.jpg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      description: 'Lo-fi beats to code to.',
      channelId: { _id: 'channel04', channelName: 'Lofi Girl' },
      channelName: 'Lofi Girl',
      views: 50000,
      likes: 3000,
      dislikes: 100,
      uploadDate: '2024-08-20',
      category: 'Music'
    },
    {
      _id: 'video07',
      title: 'Python for Beginners',
      thumbnailUrl: 'https://i.ytimg.com/vi/_uQrJ0TkZlc/maxresdefault.jpg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      description: 'Learn Python from scratch.',
      channelId: { _id: 'channel05', channelName: 'Programming with Mosh' },
      channelName: 'Programming with Mosh',
      views: 45000,
      likes: 2500,
      dislikes: 75,
      uploadDate: '2024-08-15',
      category: 'Programming'
    },
    {
      _id: 'video08',
      title: 'Top 10 Gaming Moments 2024',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      description: 'Best gaming moments of the year.',
      channelId: { _id: 'channel06', channelName: 'Gaming Hub' },
      channelName: 'Gaming Hub',
      views: 80000,
      likes: 5000,
      dislikes: 200,
      uploadDate: '2024-12-28',
      category: 'Gaming'
    }
  ];
  
  if (category && category !== 'All') {
    return demoVideos.filter(v => v.category === category);
  }
  return demoVideos;
};

export default router;
