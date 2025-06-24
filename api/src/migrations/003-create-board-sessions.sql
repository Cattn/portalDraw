CREATE TABLE IF NOT EXISTS board_sessions (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    socket_id TEXT NOT NULL UNIQUE,
    session_color TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    cursor_x REAL,
    cursor_y REAL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_board_sessions_board_id ON board_sessions(board_id);
CREATE INDEX IF NOT EXISTS idx_board_sessions_socket_id ON board_sessions(socket_id);
CREATE INDEX IF NOT EXISTS idx_board_sessions_last_seen ON board_sessions(last_seen); 