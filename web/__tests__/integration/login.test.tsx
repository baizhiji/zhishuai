import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '@/app/login/page';

// Mock API adapter
jest.mock('@/services/apiAdapter', () => ({
  default: {
    auth: {
      login: jest.fn().mockResolvedValue({
        token: 'test-token',
        user: {
          id: '1',
          name: 'Test User',
          phone: '13800138000',
          role: 'customer'
        }
      })
    }
  }
}));

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

describe('LoginPage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('should render login page', () => {
    renderLoginPage();

    expect(screen.getByText('智枢AI')).toBeInTheDocument();
    expect(screen.getByText('密码登录')).toBeInTheDocument();
    expect(screen.getByText('验证码登录')).toBeInTheDocument();
  });

  it('should switch between password and code login', () => {
    renderLoginPage();

    const passwordTab = screen.getByText('密码登录');
    const codeTab = screen.getByText('验证码登录');

    expect(passwordTab).toBeInTheDocument();
    expect(codeTab).toBeInTheDocument();

    fireEvent.click(codeTab);

    expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
  });

  it('should show validation error for invalid phone', async () => {
    renderLoginPage();

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const loginButton = screen.getByRole('button', { name: /登录/i });

    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('手机号格式不正确')).toBeInTheDocument();
    });
  });

  it('should show validation error for missing password', async () => {
    renderLoginPage();

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const passwordInput = screen.getByPlaceholderText('请输入密码');
    const loginButton = screen.getByRole('button', { name: /登录/i });

    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
    });
  });

  it('should handle successful login', async () => {
    const { push } = require('next/navigation').useRouter();
    const apiAdapter = require('@/services/apiAdapter').default;

    renderLoginPage();

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    const passwordInput = screen.getByPlaceholderText('请输入密码');
    const loginButton = screen.getByRole('button', { name: /登录/i });

    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(apiAdapter.auth.login).toHaveBeenCalledWith('13800138000', '123456');
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show link to register page', () => {
    renderLoginPage();

    const registerLink = screen.getByText('立即注册');
    expect(registerLink).toBeInTheDocument();
  });
});
