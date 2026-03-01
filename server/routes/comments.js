import express from 'express';
import Comment from '../models/Comment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/comments/video/:videoId
// @desc    Get all comments for a video
// @access  Public
router.get('/video/:videoId', async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 });

    // Transform to include username directly
    const transformedComments = comments.map(comment => ({
      _id: comment._id,
      videoId: comment.videoId,
      userId: comment.userId._id,
      username: comment.userId.username,
      userAvatar: comment.userId.avatar || comment.userAvatar,
      text: comment.text,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }));

    // Return demo comments if none found
    if (transformedComments.length === 0) {
      return res.json(getDemoComments(req.params.videoId));
    }

    res.json(transformedComments);
  } catch (error) {
    console.error('Get comments error:', error);
    // Return demo comments on error
    res.json(getDemoComments(req.params.videoId));
  }
});

// @route   POST /api/comments
// @desc    Add a comment to a video
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { videoId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const comment = await Comment.create({
      videoId,
      userId: req.user._id,
      username: req.user.username,
      userAvatar: req.user.avatar,
      text: text.trim()
    });

    // Populate user info
    await comment.populate('userId', 'username avatar');

    res.status(201).json({
      _id: comment._id,
      videoId: comment.videoId,
      userId: comment.userId._id,
      username: comment.userId.username,
      userAvatar: comment.userId.avatar,
      text: comment.text,
      createdAt: comment.createdAt
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { text } = req.body;

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    comment.text = text.trim();
    await comment.save();

    res.json(comment);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Demo comments for demonstration
const getDemoComments = (videoId) => [
  {
    _id: 'comment01',
    videoId: videoId,
    userId: 'user01',
    username: 'John Doe',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    text: 'Great tutorial! Very helpful for beginners.',
    createdAt: '2024-09-21T10:30:00Z'
  },
  {
    _id: 'comment02',
    videoId: videoId,
    userId: 'user02',
    username: 'Jane Smith',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    text: 'Could you make a video about advanced topics next?',
    createdAt: '2024-09-21T11:45:00Z'
  },
  {
    _id: 'comment03',
    videoId: videoId,
    userId: 'user03',
    username: 'Mike Johnson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    text: 'Exactly what I was looking for! Thank you!',
    createdAt: '2024-09-22T09:15:00Z'
  }
];

export default router;
