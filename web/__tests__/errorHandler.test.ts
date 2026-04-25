import { message } from 'antd'
import ErrorHandler from '@/lib/errorHandler'

// 模拟antd的message
jest.mock('antd', () => ({
  message: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
  },
}))

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('应该处理400错误', () => {
      const error = {
        response: {
          data: { message: '请求参数错误' },
          status: 400,
        },
      }
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('请求参数错误')
    })

    it('应该处理401错误', () => {
      const error = {
        response: {
          data: { message: '未授权' },
          status: 401,
        },
      }
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('未授权，请重新登录')
    })

    it('应该处理404错误', () => {
      const error = {
        response: {
          data: { message: '资源不存在' },
          status: 404,
        },
      }
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('请求的资源不存在')
    })

    it('应该处理500错误', () => {
      const error = {
        response: {
          data: { message: '服务器错误' },
          status: 500,
        },
      }
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('服务器内部错误')
    })

    it('应该处理网络错误', () => {
      const error = {
        request: {},
      }
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('网络错误，请检查网络连接')
    })

    it('应该处理未知错误', () => {
      const error = {
        message: '未知错误',
      }
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('未知错误')
    })
  })

  describe('showError', () => {
    it('应该显示错误消息', () => {
      const error = {
        response: {
          data: { message: '测试错误' },
          status: 400,
        },
      }
      ErrorHandler.showError(error)
      expect(message.error).toHaveBeenCalledWith('测试错误', 3)
    })
  })

  describe('showSuccess', () => {
    it('应该显示成功消息', () => {
      ErrorHandler.showSuccess('操作成功')
      expect(message.success).toHaveBeenCalledWith('操作成功', 3)
    })
  })

  describe('showWarning', () => {
    it('应该显示警告消息', () => {
      ErrorHandler.showWarning('警告信息')
      expect(message.warning).toHaveBeenCalledWith('警告信息', 3)
    })
  })

  describe('showInfo', () => {
    it('应该显示信息消息', () => {
      ErrorHandler.showInfo('信息提示')
      expect(message.info).toHaveBeenCalledWith('信息提示', 3)
    })
  })

  describe('showLoading', () => {
    it('应该显示加载消息', () => {
      const result = ErrorHandler.showLoading('加载中...')
      expect(message.loading).toHaveBeenCalledWith('加载中...', 0)
      expect(result).toBeDefined()
    })
  })

  describe('withErrorHandling', () => {
    it('应该成功处理Promise', async () => {
      const promise = Promise.resolve({ data: 'success' })
      const [result, error] = await ErrorHandler.withErrorHandling(promise)

      expect(result).toEqual({ data: 'success' })
      expect(error).toBeNull()
    })

    it('应该处理Promise错误', async () => {
      const promise = Promise.reject(new Error('测试错误'))
      const [result, error] = await ErrorHandler.withErrorHandling(promise)

      expect(result).toBeNull()
      expect(error).toBeInstanceOf(Error)
      expect(message.error).toHaveBeenCalled()
    })
  })
})
