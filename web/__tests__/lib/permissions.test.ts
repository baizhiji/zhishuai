import {
  isAuthenticated,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  permissions
} from '@/lib/permissions';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Permissions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isAuthenticated', () => {
    it('should return false when no token or user', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when token and user exist', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when only token exists', () => {
      localStorage.setItem('token', 'test-token');

      expect(isAuthenticated()).toBe(false);
    });

    it('should return false when only user exists', () => {
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('hasPermission', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));
    });

    it('should return true for admin with valid permission', () => {
      expect(hasPermission('dashboard:read')).toBe(true);
      expect(hasPermission('materials:read')).toBe(true);
      expect(hasPermission('settings:users')).toBe(true);
    });

    it('should return false for admin with invalid permission', () => {
      expect(hasPermission('invalid:permission')).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      localStorage.clear();

      expect(hasPermission('dashboard:read')).toBe(false);
    });

    it('should work with agent role', () => {
      localStorage.setItem('user', JSON.stringify({ id: '2', role: 'agent' }));

      expect(hasPermission('dashboard:read')).toBe(true);
      expect(hasPermission('materials:create')).toBe(true);
      expect(hasPermission('settings:users')).toBe(false);
    });

    it('should work with customer role', () => {
      localStorage.setItem('user', JSON.stringify({ id: '3', role: 'customer' }));

      expect(hasPermission('dashboard:read')).toBe(true);
      expect(hasPermission('materials:read')).toBe(true);
      expect(hasPermission('materials:create')).toBe(false);
      expect(hasPermission('settings:users')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));
    });

    it('should return true if any permission exists', () => {
      expect(hasAnyPermission(['dashboard:read', 'invalid:permission'])).toBe(true);
    });

    it('should return false if no permissions exist', () => {
      expect(hasAnyPermission(['invalid:permission', 'another:invalid'])).toBe(false);
    });

    it('should work with customer role', () => {
      localStorage.setItem('user', JSON.stringify({ id: '3', role: 'customer' }));

      expect(hasAnyPermission(['materials:read', 'materials:create'])).toBe(true);
      expect(hasAnyPermission(['materials:create', 'materials:update'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));
    });

    it('should return true if all permissions exist', () => {
      expect(hasAllPermissions(['dashboard:read', 'materials:read'])).toBe(true);
    });

    it('should return false if any permission is missing', () => {
      expect(hasAllPermissions(['dashboard:read', 'invalid:permission'])).toBe(false);
    });

    it('should work with customer role', () => {
      localStorage.setItem('user', JSON.stringify({ id: '3', role: 'customer' }));

      expect(hasAllPermissions(['dashboard:read', 'materials:read'])).toBe(true);
      expect(hasAllPermissions(['dashboard:read', 'materials:create'])).toBe(false);
    });
  });

  describe('hasRole', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    it('should return true for matching role', () => {
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));

      expect(hasRole('admin')).toBe(true);
      expect(hasRole('agent')).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      expect(hasRole('admin')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    it('should return true if user has any of the roles', () => {
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));

      expect(hasAnyRole(['admin', 'agent'])).toBe(true);
    });

    it('should return false if user has none of the roles', () => {
      localStorage.setItem('user', JSON.stringify({ id: '3', role: 'customer' }));

      expect(hasAnyRole(['admin', 'agent'])).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      expect(hasAnyRole(['admin', 'agent'])).toBe(false);
    });
  });

  describe('permissions object', () => {
    it('should have admin permissions', () => {
      expect(permissions.admin).toBeDefined();
      expect(permissions.admin.length).toBeGreaterThan(0);
      expect(permissions.admin).toContain('dashboard:read');
      expect(permissions.admin).toContain('settings:users');
    });

    it('should have agent permissions', () => {
      expect(permissions.agent).toBeDefined();
      expect(permissions.agent.length).toBeGreaterThan(0);
      expect(permissions.agent).toContain('dashboard:read');
      expect(permissions.agent).not.toContain('settings:users');
    });

    it('should have customer permissions', () => {
      expect(permissions.customer).toBeDefined();
      expect(permissions.customer.length).toBeGreaterThan(0);
      expect(permissions.customer).toContain('dashboard:read');
      expect(permissions.customer).not.toContain('settings:users');
      expect(permissions.customer).not.toContain('materials:create');
    });

    it('admin should have more permissions than agent', () => {
      expect(permissions.admin.length).toBeGreaterThan(permissions.agent.length);
    });

    it('agent should have more permissions than customer', () => {
      expect(permissions.agent.length).toBeGreaterThan(permissions.customer.length);
    });
  });
});
