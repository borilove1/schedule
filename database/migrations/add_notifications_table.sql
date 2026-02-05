-- Migration: Add notifications table for in-app notifications
-- Date: 2026-02-05
-- Description: Creates notifications table to store user notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'EVENT_REMINDER', 'EVENT_COMPLETED', 'EVENT_UPDATED', 'EVENT_DELETED', 'SYSTEM'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,

    -- Related entities (optional)
    related_event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    related_series_id INTEGER REFERENCES event_series(id) ON DELETE SET NULL,

    -- Metadata (flexible JSON data)
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Add comment to table
COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON COLUMN notifications.type IS 'Notification type: EVENT_REMINDER, EVENT_COMPLETED, EVENT_UPDATED, EVENT_DELETED, SYSTEM';
COMMENT ON COLUMN notifications.metadata IS 'Flexible JSON data for additional notification information';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';
