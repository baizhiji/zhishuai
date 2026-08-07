'use client';

import { Modal, Form, Input, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { post } from '@/lib/request';

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PasswordModal({ open, onClose }: PasswordModalProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await post('/account/password', values);
      message.success('密码修改成功');
      form.resetFields();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation error
      message.error(err?.message || '修改失败');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="修改密码"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose
      okText="确认修改"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="oldPassword"
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6位' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（至少6位）" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
