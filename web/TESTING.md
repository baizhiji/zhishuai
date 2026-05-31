# 测试文档

## 概述

本项目使用 Jest 和 React Testing Library 进行单元测试和集成测试。

## 测试类型

### 单元测试

- **Hooks测试**: `__tests__/hooks/`
  - `usePerformance.test.ts` - 性能相关Hook的测试

- **服务测试**: `__tests__/services/`
  - `mockApi.test.ts` - Mock API服务的测试

- **工具函数测试**: `__tests__/lib/`
  - `permissions.test.ts` - 权限管理工具函数的测试

### 集成测试

- **页面测试**: `__tests__/integration/`
  - `login.test.tsx` - 登录页面的集成测试

## 运行测试

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
npm test usePerformance.test.ts
```

### 运行匹配特定模式的测试

```bash
npm test -- --testNamePattern="useDebounce"
```

### 以监视模式运行测试

```bash
npm test -- --watch
```

### 生成覆盖率报告

```bash
npm test -- --coverage
```

## 测试最佳实践

### 1. 命名规范

测试文件名: `*.test.ts` 或 `*.test.tsx`

测试描述使用清晰的语言，描述被测试的功能:

```typescript
describe('useDebounce', () => {
  it('should debounce the value', () => {
    // 测试代码
  });
});
```

### 2. 测试结构

使用 AAA 模式 (Arrange, Act, Assert):

```typescript
it('should do something', () => {
  // Arrange - 准备测试数据
  const inputValue = 'test';

  // Act - 执行被测试的函数
  const result = someFunction(inputValue);

  // Assert - 验证结果
  expect(result).toBe('expected');
});
```

### 3. Mock 外部依赖

使用 Jest 的 mock 功能模拟外部依赖:

```typescript
jest.mock('@/services/apiAdapter', () => ({
  default: {
    auth: {
      login: jest.fn().mockResolvedValue({
        token: 'test-token',
        user: { id: '1', name: 'Test User' }
      })
    }
  }
}));
```

### 4. 清理副作用

在每次测试前清理副作用:

```typescript
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});
```

### 5. 异步测试

使用 async/await 和 waitFor 处理异步操作:

```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

## 测试覆盖率目标

- **整体覆盖率**: > 70%
- **核心业务逻辑**: > 90%
- **工具函数**: 100%

## 持续集成

测试会在以下情况下自动运行:

1. 每次 Pull Request
2. 合并到 main 分支
3. 每日定时构建

## 调试测试

### 在 VS Code 中调试

1. 安装 Jest Runner 扩展
2. 在测试文件中点击运行按钮
3. 使用断点进行调试

### 在浏览器中调试

1. 使用 `npm test -- --watch`
2. 在测试文件中添加 `debugger;`
3. 打开浏览器开发者工具

## 常见问题

### Q: 测试超时怎么办?

A: 增加超时时间:

```typescript
jest.setTimeout(10000); // 10秒
```

### Q: 如何测试组件的快照?

A: 使用 toMatchSnapshot:

```typescript
it('should match snapshot', () => {
  const { container } = render(<MyComponent />);
  expect(container.firstChild).toMatchSnapshot();
});
```

### Q: 如何模拟路由?

A: 使用 BrowserRouter 或 mock router:

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/test'
  })
}));
```

## 参考资源

- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js 测试文档](https://nextjs.org/docs/testing)
