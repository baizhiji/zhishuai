import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { validationError } from './api-response';

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidateOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const targets: { target: ValidationTarget; schema: ZodSchema; data: unknown }[] = [];

    if (schemas.body) targets.push({ target: 'body', schema: schemas.body, data: req.body });
    if (schemas.query) targets.push({ target: 'query', schema: schemas.query, data: req.query });
    if (schemas.params) targets.push({ target: 'params', schema: schemas.params, data: req.params });

    const errors: { target: string; issues: unknown[] }[] = [];

    for (const { target, schema, data } of targets) {
      const result = schema.safeParse(data);
      if (result.success) {
        // Replace with parsed (and potentially transformed) data
        if (target === 'body') req.body = result.data;
        else if (target === 'query') (req as unknown as Record<string, unknown>)[target] = result.data;
        else if (target === 'params') req.params = result.data as Record<string, string>;
      } else {
        errors.push({
          target,
          issues: (result.error as ZodError).issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
            code: i.code,
          })),
        });
      }
    }

    if (errors.length > 0) {
      validationError(res, '请求参数验证失败', errors);
      return;
    }

    next();
  };
}
