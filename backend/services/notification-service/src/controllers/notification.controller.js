import { Notification } from '../models/Notification.model.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/v1/notifications (ADD §11.1)
export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) throw new ApiError(401, 'UNAUTHENTICATED', 'User context missing');

        const { unreadOnly, page = 1, limit = 20 } = req.query;

        const query = { userId };
        if (unreadOnly === 'true') query.read = false;

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const [notifications, totalCount, unreadCount] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ userId, read: false })
        ]);

        res.status(200).json({
            data: { notifications, unreadCount },
            meta: {
                totalCount,
                page: pageNum,
                limit: limitNum,
                hasMore: (pageNum * limitNum) < totalCount,
                requestId: req.requestId
            },
            error: null
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/v1/notifications/:id/read (ADD §11.2)
export const markAsRead = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) throw new ApiError(401, 'UNAUTHENTICATED', 'User context missing');

        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { notificationId: id, userId },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) throw new ApiError(404, 'NOT_FOUND', 'Notification not found');

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// PATCH /api/v1/notifications/read-all (ADD §11.3)
export const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) throw new ApiError(401, 'UNAUTHENTICATED', 'User context missing');

        await Notification.updateMany(
            { userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};