const { query } = require('../../config/database');

/**
 * Convert snake_case to camelCase for frontend
 */
const convertToCamelCase = (obj) => {
  const camelCaseObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    camelCaseObj[camelKey] = obj[key];
  }
  return camelCaseObj;
};

/**
 * Get notifications for current user
 * GET /api/v1/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 50, isRead } = req.query;
    const userId = req.user.id;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];

    if (isRead !== undefined) {
      whereClause += ' AND is_read = $2';
      params.push(isRead === 'true');
    }

    const notificationsQuery = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
    `;
    params.push(parseInt(limit));

    const result = await query(notificationsQuery, params);

    // Convert to camelCase
    const notifications = result.rows.map(convertToCamelCase);

    res.json({ success: true, data: { notifications } });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;

    const result = await query(countQuery, [userId]);
    const count = parseInt(result.rows[0].count);

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updateQuery = `
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await query(updateQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const notification = convertToCamelCase(result.rows[0]);

    res.json({ success: true, data: { notification } });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

/**
 * Mark all notifications as read
 * POST /api/v1/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const updateQuery = `
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
      RETURNING *
    `;

    const result = await query(updateQuery, [userId]);

    const notifications = result.rows.map(convertToCamelCase);

    res.json({
      success: true,
      data: {
        notifications,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};

/**
 * Delete notification
 * DELETE /api/v1/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleteQuery = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await query(deleteQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

/**
 * Create notification (helper function)
 * Used internally by other controllers
 */
exports.createNotification = async (userId, type, title, message, relatedEventId = null, metadata = null) => {
  try {
    const insertQuery = `
      INSERT INTO notifications (user_id, type, title, message, related_event_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      userId,
      type,
      title,
      message,
      relatedEventId,
      metadata ? JSON.stringify(metadata) : null
    ]);

    return convertToCamelCase(result.rows[0]);
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Check upcoming events and create reminders
 * POST /api/v1/notifications/check-reminders
 */
exports.checkReminders = async (req, res) => {
  try {
    const { hoursAhead = 24 } = req.body;
    const { checkAllUpcomingEvents } = require('../utils/reminderService');

    const result = await checkAllUpcomingEvents(hoursAhead);

    res.json({
      success: true,
      message: 'Reminders checked',
      data: result
    });
  } catch (error) {
    console.error('Check reminders error:', error);
    res.status(500).json({ success: false, message: 'Failed to check reminders' });
  }
};
