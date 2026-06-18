// Swagger/OpenAPI 文档配置
// 安装: npm install swagger-ui-express swagger-jsdoc
// 访问: http://localhost:3001/api-docs

import type { Request, Response } from 'express';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '智枢 AI SaaS API',
      version: '1.0.0',
      description: '智枢AI SaaS系统后端API文档 - 包含认证、AI、CRM、自媒体运营等全部接口',
      contact: {
        name: '智枢技术团队',
      },
    },
    servers: [
      {
        url: 'https://api.baizhiji.net/api',
        description: '生产环境',
      },
      {
        url: 'http://localhost:3001/api',
        description: '开发环境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: { type: 'number', description: '错误码' },
            message: { type: 'string', description: '错误信息' },
            details: { type: 'object', description: '详细信息' },
          },
        },
        PaginatedList: {
          type: 'object',
          properties: {
            list: { type: 'array', description: '数据列表' },
            total: { type: 'number', description: '总数' },
            page: { type: 'number', description: '当前页码' },
            pageSize: { type: 'number', description: '每页数量' },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
  },
  apis: ['./src/routes/*.ts'], // 从路由文件的JSDoc注释生成文档
};

// API文档路由注册方式（在index.ts中添加）:
// import swaggerUi from 'swagger-ui-express';
// import swaggerJSDoc from 'swagger-jsdoc';
// const swaggerSpec = swaggerJSDoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
