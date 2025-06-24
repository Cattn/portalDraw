CREATE TABLE IF NOT EXISTS drawing_events (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_drawing_events_board_id ON drawing_events(board_id);
CREATE INDEX IF NOT EXISTS idx_drawing_events_timestamp ON drawing_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_drawing_events_sequence ON drawing_events(board_id, sequence_number); 