<<<<<<< HEAD
import { message } from 'antd'

export interface ApiError {
  message: string
  code?: string
  details?: any
=======
import { message } from 'antd';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
>>>>>>> 962968886be726cd434c792933b5515366d34518
}

export class ErrorHandler {
  /**
   * 处理API错误
   */
  static handleApiError(error: any): string {
    if (error.response) {
      // 服务器返回错误
<<<<<<< HEAD
      const { data, status } = error.response

      switch (status) {
        case 400:
          return data?.message || '请求参数错误'
        case 401:
          return '未授权，请重新登录'
        case 403:
          return '没有权限访问'
        case 404:
          return '请求的资源不存在'
        case 500:
          return '服务器内部错误'
        default:
          return data?.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return '网络错误，请检查网络连接'
    } else {
      // 请求设置错误
      return error.message || '未知错误'
=======
      const { data, status } = error.response;

      switch (status) {
        case 400:
          return data?.message || '请求参数错误';
        case 401:
          return '未授权，请重新登录';
        case 403:
          return '没有权限访问';
        case 404:
          return '请求的资源不存在';
        case 500:
          return '服务器内部错误';
        default:
          return data?.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return '网络错误，请检查网络连接';
    } else {
      // 请求设置错误
      return error.message || '未知错误';
>>>>>>> 962968886be726cd434c792933b5515366d34518
    }
  }

  /**
   * 显示错误消息
   */
  static showError(error: any, duration = 3): void {
<<<<<<< HEAD
    const errorMessage = this.handleApiError(error)
    message.error(errorMessage, duration)
=======
    const errorMessage = this.handleApiError(error);
    message.error(errorMessage, duration);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  /**
   * 显示成功消息
   */
  static showSuccess(msg: string, duration = 3): void {
<<<<<<< HEAD
    message.success(msg, duration)
=======
    message.success(msg, duration);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  /**
   * 显示警告消息
   */
  static showWarning(msg: string, duration = 3): void {
<<<<<<< HEAD
    message.warning(msg, duration)
=======
    message.warning(msg, duration);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  /**
   * 显示信息消息
   */
  static showInfo(msg: string, duration = 3): void {
<<<<<<< HEAD
    message.info(msg, duration)
=======
    message.info(msg, duration);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  /**
   * 显示加载消息
   */
  static showLoading(msg = '加载中...', duration = 0): any {
<<<<<<< HEAD
    return message.loading(msg, duration)
=======
    return message.loading(msg, duration);
>>>>>>> 962968886be726cd434c792933b5515366d34518
  }

  /**
   * 捕获异步错误
   */
  static async withErrorHandling<T>(
    promise: Promise<T>,
    errorMessage = '操作失败'
  ): Promise<[T | null, Error | null]> {
    try {
<<<<<<< HEAD
      const result = await promise
      return [result, null]
    } catch (error) {
      this.showError(error)
      return [null, error as Error]
=======
      const result = await promise;
      return [result, null];
    } catch (error) {
      this.showError(error);
      return [null, error as Error];
>>>>>>> 962968886be726cd434c792933b5515366d34518
    }
  }
}

// 默认导出
<<<<<<< HEAD
export default ErrorHandler
=======
export default ErrorHandler;
>>>>>>> 962968886be726cd434c792933b5515366d34518
