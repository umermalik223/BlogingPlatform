-- Enable foreign key constraints
PRAGMA foreign_keys=ON;

-- Drop tables if they exist (for testing or re-creation purposes)
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS reactions; -- Add this line to drop the reactions table if it exists

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    reads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    name TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_title TEXT,
    author_name TEXT
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    reaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    reaction_type TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE
);

-- Insert default data (if necessary)

-- Set up initial settings
INSERT INTO settings (blog_title, author_name) VALUES ('My Blog', 'John Doe');

-- Example users
INSERT INTO users (user_name) VALUES ('Author1');
INSERT INTO users (user_name) VALUES ('Author2');

-- Example articles
INSERT INTO articles (title, content, user_id) VALUES ('First Article', 'This is the content of the first article.', 1);
INSERT INTO articles (title, content, user_id) VALUES ('Second Article', 'This is the content of the second article.', 2);

-- Example comments
INSERT INTO comments (article_id, name, comment) VALUES (1, 'Reader1', 'Great article!');
INSERT INTO comments (article_id, name, comment) VALUES (1, 'Reader2', 'Interesting insights.');

-- Example reactions
INSERT INTO reactions (article_id, reaction_type, count) VALUES (1, 'like', 0);
INSERT INTO reactions (article_id, reaction_type, count) VALUES (1, 'love', 0);
INSERT INTO reactions (article_id, reaction_type, count) VALUES (1, 'laugh', 0);
INSERT INTO reactions (article_id, reaction_type, count) VALUES (2, 'like', 0);
INSERT INTO reactions (article_id, reaction_type, count) VALUES (2, 'love', 0);
INSERT INTO reactions (article_id, reaction_type, count) VALUES (2, 'laugh', 0);

ALTER TABLE comments ADD COLUMN status TEXT DEFAULT 'pending';

-- Ensure foreign key constraints are enforced
PRAGMA foreign_keys=ON;
