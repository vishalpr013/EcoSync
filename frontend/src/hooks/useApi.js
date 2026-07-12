import { useState, useCallback, useEffect } from 'react';

export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        return result;
      } catch (err) {
        const errMsg = err.response?.data?.detail || err.message || 'An error occurred';
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  return { data, error, loading, execute, setData };
};

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const usePagination = (initialPage = 1, initialSize = 10) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);

  const onPageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const onPageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setPage(1); // Reset to page 1 when size changes
  }, []);

  return {
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
  };
};
