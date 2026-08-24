import { renderHook, act } from '@testing-library/react';
import { useDebounce, useThrottle, useAsync, useLocalStorage } from '@/hooks/usePerformance';

// Mock timers
jest.useFakeTimers();

describe('useDebounce', () => {
  it('should debounce the value', () => {
    const { result } = renderHook(() => useDebounce('test', 500));

    expect(result.current).toBe('test');

    act(() => {
      result.current = 'updated';
    });

    expect(result.current).toBe('test'); // Value hasn't changed yet

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated'); // Value changed after delay
  });
});

describe('useThrottle', () => {
  it('should throttle the callback', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottle(callback, 500));

    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1');

    act(() => {
      jest.advanceTimersByTime(500);
      result.current('arg4');
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('arg4');
  });
});

describe('useAsync', () => {
  it('should handle async operations', async () => {
    const asyncFn = jest.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useAsync(asyncFn));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await result.current.execute('arg1');
    });

    expect(asyncFn).toHaveBeenCalledWith('arg1');
    expect(result.current.data).toBe('result');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors', async () => {
    const asyncFn = jest.fn().mockRejectedValue(new Error('Test error'));
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Test error');
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should read and write to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should remove from localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[1]('updated');
    });

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe('default');
    expect(localStorage.getItem('test-key')).toBe(null);
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev * 2);
    });

    expect(result.current[0]).toBe(2);
  });
});
