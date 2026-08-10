import { Credential } from '../models/Credential.model.js';

export const authAnalyticsSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalPatients, totalProfessionals, signedUpToday, signedUpThisMonth] = await Promise.all([
      Credential.countDocuments({ role: 'patient' }),
      Credential.countDocuments({ role: 'professional' }),
      Credential.countDocuments({ createdAt: { $gte: todayStart }, role: 'patient' }),
      Credential.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);

    res.status(200).json({
      data: { users: { totalPatients, totalProfessionals, signedUpToday, signedUpThisMonth } },
      error: null
    });
  } catch (error) { next(error); }
};