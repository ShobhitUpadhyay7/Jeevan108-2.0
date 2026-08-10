import { Application } from '../models/Application.model.js';

export const applicationAnalyticsSummary = async (req, res, next) => {
  try {
    const [total, pendingReview, approved, rejected] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' }),
    ]);

    res.status(200).json({
      data: { applications: { total, pendingReview, approved, rejected } },
      error: null
    });
  } catch (error) { next(error); }
};