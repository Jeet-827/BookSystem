import express from 'express';
import Poster from '../models/Poster.js';
import asyncHandler from '../utils/asyncHandler.js';
import { samplePosters } from '../data/samplePosters.js';

const router = express.Router();

// @desc    Get all active promotional posters and banners
// @route   GET /api/posters
// @access  Public
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let posters = await Poster.find({ isActive: true }).sort({ displayOrder: 1 }).lean();

    // If database has no posters yet, return sample posters as fallback
    if (!posters || posters.length === 0) {
      posters = samplePosters;
    }

    res.json({
      success: true,
      count: posters.length,
      posters,
    });
  })
);

// @desc    Get poster by ID
// @route   GET /api/posters/:id
// @access  Public
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const poster = await Poster.findById(req.params.id);
    if (!poster) {
      return res.status(404).json({ success: false, message: 'Poster not found' });
    }
    res.json({ success: true, poster });
  })
);

export default router;
