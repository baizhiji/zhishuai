import { z } from 'zod';

export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号');

export const passwordSchema = z.string().min(6, '密码至少6位').max(64, '密码最多64位');

export const sendCodeSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    type: z.enum(['register', 'login', 'reset']).default('register'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    code: z.string().length(6, '验证码为6位数字'),
    password: passwordSchema,
    name: z.string().min(1, '请输入姓名').max(50).optional(),
    referralCode: z.string().max(20).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    password: z.string().min(1, '请输入密码'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, '请输入当前密码'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, '请确认新密码'),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, '请输入姓名').max(50).optional(),
    email: z.string().email('请输入正确的邮箱').optional().or(z.literal('')),
    avatar: z.string().url().optional().or(z.literal('')),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});
