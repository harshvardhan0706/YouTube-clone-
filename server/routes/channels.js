import express from 'express';
import Channel from '../models/Channel.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/channels
// @desc    Get all channels
// @access  Public
router.get('/', async (req, res) => {
  try {
    const channels = await Channel.find()
      .populate('owner', 'username avatar')
      .sort({ subscribers: -1 });

    // Return demo channels if none found
    if (channels.length === 0) {
      return res.json(getDemoChannels());
    }

    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    // Return demo channels on error
    res.json(getDemoChannels());
  }
});

// @route   GET /api/channels/:id
// @desc    Get single channel by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('owner', 'username avatar');

    if (!channel) {
      // Return demo channel if not found
      const demoChannel = getDemoChannels().find(c => c._id === req.params.id);
      if (demoChannel) {
        return res.json({ channel: demoChannel, videos: getDemoVideos().filter(v => v.channelId._id === demoChannel._id || v.channelId === demoChannel._id) });
      }
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Get videos for this channel
    const videos = await Video.find({ channelId: channel._id })
      .populate('uploader', 'username avatar')
      .sort({ uploadDate: -1 });

    res.json({ channel, videos });
  } catch (error) {
    console.error('Get channel error:', error);
    // Return demo channel on error
    const demoChannel = getDemoChannels().find(c => c._id === req.params.id);
    if (demoChannel) {
      return res.json({ channel: demoChannel, videos: getDemoVideos().filter(v => v.channelId._id === demoChannel._id || v.channelId === demoChannel._id) });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/channels
// @desc    Create a new channel
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { channelName, description, channelBanner } = req.body;

    // Validation
    if (!channelName) {
      return res.status(400).json({ message: 'Channel name is required' });
    }

    // Check if user already has a channel with same name
    const existingChannel = await Channel.findOne({ channelName });
    if (existingChannel) {
      return res.status(400).json({ message: 'Channel name already exists' });
    }

    // Create channel
    const channel = await Channel.create({
      channelName,
      owner: req.user._id,
      description: description || '',
      channelBanner: channelBanner || `https://api.dicebear.com/7.x/shapes/svg?seed=${channelName}`,
      subscribers: 0
    });

    // Add channel to user's channels
    await User.findByIdAndUpdate(req.user._id, {
      $push: { channels: channel._id }
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/channels/:id
// @desc    Update a channel
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { channelName, description, channelBanner } = req.body;

    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check ownership
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this channel' });
    }

    if (channelName) channel.channelName = channelName;
    if (description !== undefined) channel.description = description;
    if (channelBanner) channel.channelBanner = channelBanner;

    const updatedChannel = await channel.save();
    res.json(updatedChannel);
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/channels/:id
// @desc    Delete a channel
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check ownership
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this channel' });
    }

    // Delete all videos in the channel
    await Video.deleteMany({ channelId: channel._id });

    // Remove channel from user's channels
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { channels: channel._id }
    });

    await channel.deleteOne();
    res.json({ message: 'Channel deleted' });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/channels/user/:userId
// @desc    Get channels by user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const channels = await Channel.find({ owner: req.params.userId })
      .populate('owner', 'username avatar');

    res.json(channels);
  } catch (error) {
    console.error('Get user channels error:', error);
    res.json([]);
  }
});

// Demo data functions
const getDemoVideos = () => [
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
  }
];

const getDemoChannels = () => [
  {
    _id: 'channel01',
    channelName: 'Code with John',
    description: 'Learn programming from scratch',
    owner: { _id: 'user01', username: 'john', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john' },
    subscribers: 15000,
    channelBanner: 'https://via.placeholder.com/1280x200?text=Code+with+John'
  },
  {
    _id: 'channel02',
    channelName: 'Web Dev Simplified',
    description: 'Simple web development tutorials',
    owner: { _id: 'user02', username: 'kyle', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kyle' },
    subscribers: 25000,
    channelBanner: 'https://via.placeholder.com/1280x200?text=Web+Dev+Simplified'
  }
];

export default router;
