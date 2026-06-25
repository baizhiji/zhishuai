import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  // 开发环境允许 fallback，但生产环境必须配置
  process.env.NODE_ENV === 'production' && process.exit(1);
}
const FALLBACK_SECRET = 'dev_fallback_change_in_production_DO_NOT_USE_IN_PROD';
const ACTIVE_SECRET = JWT_SECRET || FALLBACK_SECRET;
const SALT_ROUNDS = 10;

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userStatus?: string;
  deviceId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    // 优先从Authorization头获取，其次从Cookie获取
    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }

    const decoded = jwt.verify(token, ACTIVE_SECRET) as { userId: string; role: string; status?: string };
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userStatus = decoded.status || 'active';
    req.deviceId = req.headers['x-device-id'] as string || '';
    
    if (req.userStatus !== 'active') {
      return res.status(403).json({ error: '账号已被冻结，请联系管理员' });
    }
    
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token已过期，请重新登录' });
    }
    return res.status(401).json({ error: 'Token无效，请重新登录' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

export const agentMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'agent' && req.userRole !== 'admin') {
    return res.status(403).json({ error: '需要代理商权限' });
  }
  next();
};

export const generateToken = (userId: string, role: string, status?: string): string => {
  return jwt.sign({ userId, role, status: status || 'active' }, ACTIVE_SECRET, { expiresIn: '7d' });
};

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, SALT_ROUNDS);
};

export const verifyPassword = (password: string, hash: string): boolean => {
  return bcrypt.compareSync(password, hash);
};
