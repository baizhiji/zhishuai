import { NextRequest, NextResponse } from 'next/server';

// 受保护路径前缀（未登录访问将重定向到登录页，防止页面结构/路由信息暴露）
// 与服务端 AuthGuard 的 publicPaths 保持对应：不在公开列表内的核心业务路径均受保护
const PROTECTED_PREFIXES = [
  '/admin',
  '/agent',
  '/customer',
  '/account',
  '/profile',
  '/notifications',
];

// 公开路径（无需登录，与 web/components/auth/AuthGuard.tsx 的 publicPaths 保持一致）
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/about',
  '/help',
  '/features',
  '/pricing',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源与 API 路由不受守卫（API 鉴权由后端 authMiddleware 完成）
  const isStaticOrApi =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.');

  // 公开路径放行
  const isPublic =
    pathname === '/' ||
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (isStaticOrApi || isPublic) {
    return NextResponse.next();
  }

  // 未登录访问受保护路径 → 重定向登录页
  const token = request.cookies.get('auth_token')?.value;
  if (!token && PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 排除静态资源、API 路由与带扩展名的文件
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
