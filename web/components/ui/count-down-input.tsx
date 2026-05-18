'use client';

import { useState, useEffect } from 'react';
import { Input, Button } from 'antd';
import { AuthAPI } from '@/services/auth';

interface CountDownInputProps {
  value?: string;
  onChange?: (value: string) => void;
  phone?: string;
  placeholder?: string;
  size?: 'large' | 'middle' | 'small';
  disabled?: boolean;
  onSend?: () => void;
}

export default function CountDownInput({
  value,
  onChange,
  phone,
  placeholder = '请输入验证码',
  size = 'middle',
  disabled,
  onSend,
}: CountDownInputProps) {
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await AuthAPI.sendCode(phone);
      if (res.success) {
        setCountdown(60);
        onSend?.();
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Input.Group compact style={{ display: 'flex' }}>
      <Input
        style={{ flex: 1 }}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        size={size}
        disabled={disabled}
        maxLength={6}
      />
      <Button
        style={{ width: 120 }}
        size={size}
        disabled={countdown > 0 || !phone || disabled}
        loading={loading}
        onClick={handleSendCode}
      >
        {countdown > 0 ? `${countdown}s` : '获取验证码'}
      </Button>
    </Input.Group>
  );
}
