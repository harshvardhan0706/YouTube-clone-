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

    res.json(transformedComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
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

export default router;
