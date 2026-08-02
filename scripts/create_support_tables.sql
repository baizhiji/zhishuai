-- 客服系统建表SQL
-- 创建客服会话表
CREATE TABLE IF NOT EXISTS SupportConversation (
  id VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '在线咨询',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  autoReply TINYINT(1) NOT NULL DEFAULT 1,
  lastMessageAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_userId_createdAt (userId, createdAt),
  INDEX idx_status_lastMessageAt (status, lastMessageAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建客服消息表
CREATE TABLE IF NOT EXISTS SupportMessage (
  id VARCHAR(36) NOT NULL,
  conversationId VARCHAR(36) NOT NULL,
  senderId VARCHAR(36) NOT NULL,
  senderName VARCHAR(100) NOT NULL DEFAULT '',
  senderRole VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  isAutoReply TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_conversationId_createdAt (conversationId, createdAt),
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversationId) REFERENCES SupportConversation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Support tables created successfully' as result;
