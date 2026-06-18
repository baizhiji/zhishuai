// 统一API错误码和异常处理

// 错误码枚举
export enum ErrorCode {
  // 通用错误 (1xxx)
  UNKNOWN_ERROR = 1000,
  VALIDATION_ERROR = 1001,
  RATE_LIMIT = 1002,
  SERVICE_UNAVAILABLE = 1003,

  // 认证错误 (2xxx)
  UNAUTHORIZED = 2001,
  TOKEN_EXPIRED = 2002,
  TOKEN_INVALID = 2003,
  FORBIDDEN = 2004,
  ACCOUNT_FROZEN = 2005,

  // 资源错误 (3xxx)
  NOT_FOUND = 3001,
  ALREADY_EXISTS = 3002,
  RESOURCE_CONFLICT = 3003,

  // 业务错误 (4xxx)
  INSUFFICIENT_BALANCE = 4001,
  AI_QUOTA_EXCEEDED = 4002,
  SMS_NOT_CONFIGURED = 4003,
  PUBLISH_FAILED = 4004,
  VOICE_CLONE_FAILED = 4005,

  // 系统错误 (5xxx)
  DATABASE_ERROR = 5001,
  EXTERNAL_API_ERROR = 5002,
  FILE_UPLOAD_ERROR = 5003,
}

// 错误码到HTTP状态的映射
const errorCodeToStatus: Record<number, number> = {
  [ErrorCode.UNKNOWN_ERROR]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.RATE_LIMIT]: 429,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.ACCOUNT_FROZEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.INSUFFICIENT_BALANCE]: 402,
  [ErrorCode.AI_QUOTA_EXCEEDED]: 429,
  [ErrorCode.SMS_NOT_CONFIGURED]: 503,
  [ErrorCode.PUBLISH_FAILED]: 500,
  [ErrorCode.VOICE_CLONE_FAILED]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.FILE_UPLOAD_ERROR]: 500,
};

// 错误码到中文消息的映射
const errorCodeToMessage: Record<number, string> = {
  [ErrorCode.UNKNOWN_ERROR]: '未知错误',
  [ErrorCode.VALIDATION_ERROR]: '参数验证失败',
  [ErrorCode.RATE_LIMIT]: '请求过于频繁',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂不可用',
  [ErrorCode.UNAUTHORIZED]: '未授权，请先登录',
  [ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCode.TOKEN_INVALID]: 'Token无效，请重新登录',
  [ErrorCode.FORBIDDEN]: '无权访问',
  [ErrorCode.ACCOUNT_FROZEN]: '账号已被冻结',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.ALREADY_EXISTS]: '资源已存在',
  [ErrorCode.RESOURCE_CONFLICT]: '资源冲突',
  [ErrorCode.INSUFFICIENT_BALANCE]: '余额不足',
  [ErrorCode.AI_QUOTA_EXCEEDED]: 'AI使用额度已用完',
  [ErrorCode.SMS_NOT_CONFIGURED]: '短信服务未配置',
  [ErrorCode.PUBLISH_FAILED]: '发布失败',
  [ErrorCode.VOICE_CLONE_FAILED]: '声音克隆失败',
  [ErrorCode.DATABASE_ERROR]: '数据库错误',
  [ErrorCode.EXTERNAL_API_ERROR]: '外部API调用失败',
  [ErrorCode.FILE_UPLOAD_ERROR]: '文件上传失败',
};

// 自定义业务异常
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: ErrorCode, message?: string, details?: any) {
    super(message || errorCodeToMessage[code]);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = errorCodeToStatus[code] || 500;
    this.details = details;
  }
}

// 统一错误响应格式
export interface ErrorResponse {
  code: number;
  message: string;
  details?: any;
  traceId?: string;
}

// 将异常转换为统一错误响应
export function toErrorResponse(error: any): { status: number; body: ErrorResponse } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  // JWT错误
  if (error.name === 'TokenExpiredError') {
    return {
      status: 401,
      body: { code: ErrorCode.TOKEN_EXPIRED, message: '登录已过期，请重新登录' },
    };
  }

  if (error.name === 'JsonWebTokenError') {
    return {
      status: 401,
      body: { code: ErrorCode.TOKEN_INVALID, message: 'Token无效' },
    };
  }

  // Prisma错误
  if (error.code === 'P2002') {
    return {
      status: 409,
      body: { code: ErrorCode.ALREADY_EXISTS, message: '数据已存在' },
    };
  }

  if (error.code === 'P2025') {
    return {
      status: 404,
      body: { code: ErrorCode.NOT_FOUND, message: '资源不存在' },
    };
  }

  // 默认500
  return {
    status: 500,
    body: {
      code: ErrorCode.UNKNOWN_ERROR,
      message: process.env.NODE_ENV === 'production'
        ? '服务器内部错误'
        : (error.message || 'Internal server error'),
    },
  };
}
