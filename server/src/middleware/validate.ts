import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        return res.status(400).json({ code: 400, message: `输入验证失败: ${messages}`, data: null });
      }
      next(error);
    }
  };
};

// 常用验证规则
import { z } from 'zod';

export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号');
export const passwordSchema = z.string().min(6, '密码至少6位').max(32, '密码最多32位');

export const loginSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    password: z.string().min(1, '请输入密码'),
    loginType: z.enum(['admin', 'agent', 'user']).optional(),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    name: z.string().min(1, '请输入姓名').max(50).optional(),
    role: z.enum(['agent', 'user']).optional(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    code: z.string().length(6, '验证码为6位'),
    newPassword: passwordSchema,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, '请输入原密码'),
    newPassword: passwordSchema,
  }),
});

export const sendCodeSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    type: z.enum(['register', 'reset_password']).optional(),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    pageSize: z.string().regex(/^\d+$/).transform(Number).default('20'),
    keyword: z.string().optional(),
  }),
});
