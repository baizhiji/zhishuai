import { Request } from 'express';
import type { ApiMeta } from './api-response';

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || DEFAULT_PAGE);
  let pageSize = parseInt(req.query.pageSize as string, 10) || DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;
  if (pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(
  pagination: PaginationParams,
  total: number,
): Pick<ApiMeta, 'page' | 'pageSize' | 'total'> {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
  };
}
