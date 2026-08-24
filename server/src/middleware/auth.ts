import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// JWT 密钥：必须通过环境变量设置，禁止硬编码回退
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

export const agentMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin' && req.userRole !== 'agent') {
    return res.status(403).json({ error: '需要代理商或管理员权限' });
  }
  next();
};

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

// 异步 bcrypt 计算，避免同步哈希阻塞 Node 事件循环导致整个服务卡顿
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // Try bcrypt first
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compare(password, hash);
  }
  // Legacy SHA256 fallback (for passwords hashed before upgrade)
  // Previous secrets must be configured via env vars, never hardcoded
  const legacySecret = process.env.LEGACY_JWT_SECRET;
  if (legacySecret) {
    const legacyHash = crypto.createHash('sha256').update(password + legacySecret).digest('hex');
    if (legacyHash === hash) return true;
  }
  const currentHash = crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
  return currentHash === hash;
};
