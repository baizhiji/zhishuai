import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * 请求验证中间件
 * 使用 Zod 验证请求数据
 */
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      // 将验证后的数据替换回去
      if (data.body) req.body = data.body;
      if (data.query) req.query = data.query;
      if (data.params) req.params = data.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors
        });
      }
      next(error);
    }
  };
}

/**
 * 验证请求体
 */
export function validateBody(schema: z.ZodSchema) {
  return validateRequest(schema);
}

/**
 * 验证查询参数
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: '查询参数验证失败',
          errors
        });
      }
      next(error);
    }
  };
}

/**
 * 验证路径参数
 */
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: '路径参数验证失败',
          errors
        });
      }
      next(error);
    }
  };
}

// 导出常用的验证类型
export { z };
