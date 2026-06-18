// API响应缓存服务 - 支持内存缓存和Redis
// 安装Redis: npm install ioredis

interface CacheEntry {
  data: any;
  expiresAt: number;
}

// 内存缓存（默认，无需Redis）
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000;

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    // 超过最大容量时清理过期条目
    if (this.cache.size >= this.maxSize) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (now > v.expiresAt) this.cache.delete(k);
      }
      if (this.cache.size >= this.maxSize) {
        // 仍然满，删除最早的
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.cache.keys()) {
      if (regex.test(key)) this.cache.delete(key);
    }
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }
}

// Redis缓存
class RedisCache {
  private client: any = null;

  async init() {
    try {
      const Redis = await import('ioredis');
      this.client = new Redis.default(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 2,
        retryStrategy(times) {
          return Math.min(times * 200, 2000);
        },
      });
      this.client.on('error', (err: any) => {
        console.error('Redis cache error:', err.message);
      });
      this.client.on('connect', () => {
        console.log('Redis cache connected');
      });
    } catch (error: any) {
      console.error('Redis not available, falling back to memory cache:', error.message);
      this.client = null;
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(`cache:${key}`, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (error: any) {
      console.error('Redis set failed:', error.message);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(`cache:${key}`);
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    const keys = await this.client.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async flush(): Promise<void> {
    if (!this.client) return;
    await this.client.flushdb();
  }
}

// 缓存服务实例
const CACHE_TYPE = process.env.CACHE_TYPE || 'memory'; // 'memory' | 'redis'

let cacheInstance: MemoryCache | RedisCache | null = null;

export async function getCache(): Promise<MemoryCache | RedisCache> {
  if (cacheInstance) return cacheInstance;

  if (CACHE_TYPE === 'redis') {
    const redis = new RedisCache();
    await redis.init();
    cacheInstance = redis;
  } else {
    cacheInstance = new MemoryCache();
  }

  return cacheInstance;
}

// 缓存中间件 - 用于Express路由
export function cacheMiddleware(ttlSeconds: number) {
  return async (req: any, res: any, next: any) => {
    // 只缓存GET请求
    if (req.method !== 'GET') return next();

    const userId = req.userId || 'anonymous';
    const key = `${userId}:${req.originalUrl}`;
    const cache = await getCache();

    try {
      const cached = await cache.get(key);
      if (cached) {
        return res.json(cached);
      }
    } catch {}

    // 拦截res.json来缓存响应
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      // 只缓存成功响应
      if (res.statusCode === 200 && data) {
        cache.set(key, data, ttlSeconds).catch(() => {});
      }
      return originalJson(data);
    };

    next();
  };
}

// 主动清除缓存（数据变更时调用）
export async function invalidateCache(pattern: string): Promise<void> {
  const cache = await getCache();
  await cache.delPattern(pattern);
}
