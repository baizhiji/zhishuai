// lib/api.ts 已废弃 - 统一使用 lib/request.ts
// 此文件保留作为向后兼容的别名
// 所有新代码请直接 import request from '@/lib/request'

export { default, getAuthToken, setAuthToken, removeAuthToken, getUserInfo, setUserInfo } from './request';
