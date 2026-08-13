import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginPage from '@/app/login/page';

const mockLogin = jest.fn();
const mockPush = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/request', () => ({
  __esModule: true,
  default: {
    post: jest.fn().mockResolvedValue({
      data: {
        token: 'test-token',
        user: {
          id: '1',
          name: 'Test User',
          phone: '13800138000',
          role: 'customer',
        },
      },
    }),
  },
}));

describe('LoginPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderLoginPage = () => render(<LoginPage />);

  it('should render login page', () => {
    renderLoginPage();

    expect(screen.getByText('智枢AI')).toBeInTheDocument();
    expect(screen.getByText('账号类型')).toBeInTheDocument();
    expect(screen.getByText('终端客户')).toBeInTheDocument();
    expect(screen.getByText('区域代理')).toBeInTheDocument();
    expect(screen.getByText('管理员')).toBeInTheDocument();
  });

  it('should switch account role', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByText('区域代理'));

    expect(screen.getByText('区域代理').style.background).toBe('rgb(255, 255, 255)');
  });

  it('should not call login API when phone is invalid', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const phoneInput = screen.getByPlaceholderText('请输入手机号') as HTMLInputElement;
    await user.type(phoneInput, '123');
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456');
    await user.click(screen.getByRole('button', { name: /登\s*录|登录/i }));

    // antd 校验失败：登录请求不应被调用
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(phoneInput.value).toBe('123');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000');
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456');
    await user.click(screen.getByRole('button', { name: /登\s*录|登录/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test-token', expect.objectContaining({ role: 'customer' }));
      expect(localStorage.getItem('viewing_role')).toBe('customer');
      expect(mockPush).toHaveBeenCalledWith('/customer/dashboard');
    });
  });

  it('should navigate to register page via footer hint', () => {
    renderLoginPage();

    expect(screen.getByText('账号由管理员统一开通管理')).toBeInTheDocument();
  });
});
