import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// JWT 密钥：优先使用环境变量，否则使用固定密钥以保持重启后 Token 有效
const JWT_SECRET = process.env.JWT_SECRET || 'zhishuai-jwt-secret-prod-2025';

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

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, 12);
};

export const verifyPassword = (password: string, hash: string): boolean => {
  // Try bcrypt first
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compareSync(password, hash);
  }
  // Legacy SHA256 fallback (for passwords hashed before upgrade)
  // Try old secret first, then current secret
  const oldJwtSecret = 'zhishuai-secret-key-2024';
  const legacyHash = crypto.createHash('sha256').update(password + oldJwtSecret).digest('hex');
  if (legacyHash === hash) return true;
  const currentHash = crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
  return currentHash === hash;
};
