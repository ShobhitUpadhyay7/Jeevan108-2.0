import { Notification } from '../models/Notification.model.js';

export const notificationAnalyticsSummary = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0,0,0,0));
    const [sentToday, unread, failedToday] = await Promise.all([
      Notification.countDocuments({ deliveredAt: { $gte: todayStart } }),
      Notification.countDocuments({ read: false }),
      Notification.countDocuments({ deliveredAt: { $gte: todayStart }, deliveryStatus: 'failed' }),
    ]);

    res.status(200).json({
      data: { notifications: { sentToday, unread, failedToday } },
      error: null
    });
  } catch (error) { next(error); }
};