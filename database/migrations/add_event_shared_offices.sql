-- 일정 공유 처/실 테이블
-- 일정(또는 반복 시리즈)을 특정 처/실과 공유하기 위한 연결 테이블
CREATE TABLE IF NOT EXISTS event_shared_offices (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  series_id INTEGER REFERENCES event_series(id) ON DELETE CASCADE,
  office_id INTEGER NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_event_or_series CHECK (
    (event_id IS NOT NULL AND series_id IS NULL) OR
    (event_id IS NULL AND series_id IS NOT NULL)
  ),
  UNIQUE(event_id, office_id),
  UNIQUE(series_id, office_id)
);

CREATE INDEX IF NOT EXISTS idx_eso_event_id ON event_shared_offices(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eso_series_id ON event_shared_offices(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eso_office_id ON event_shared_offices(office_id);
