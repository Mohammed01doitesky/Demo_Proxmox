'use client';

import { useState, useEffect, useCallback } from 'react';
import { ServerStats, VirtualMachine, ProximoXCluster } from '@/lib/proximox-client';

export function useProximoX() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Test connection using our proxy API
      const response = await fetch('/api/proximox/test-connection');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    client: null, // We use API routes instead of direct client
    isConnected,
    isLoading,
    error,
    checkConnection,
  };
}

export function useServerStats(refreshInterval = 5000) {
  const { isConnected } = useProximoX();
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isConnected) return;

    try {
      setError(null);
      const response = await fetch('/api/proximox/stats');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) return;

    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval, isConnected]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useVirtualMachines(refreshInterval = 10000) {
  const { isConnected } = useProximoX();
  const [vms, setVMs] = useState<VirtualMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVMs = useCallback(async () => {
    if (!isConnected) return;

    try {
      setError(null);
      const response = await fetch('/api/proximox/vms');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch VMs');
      }
      
      const data = await response.json();
      setVMs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch VMs');
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  const startVM = useCallback(async (vmId: string) => {
    try {
      const response = await fetch('/api/proximox/vms/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vmId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start VM');
      }

      await fetchVMs(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start VM');
      return false;
    }
  }, [fetchVMs]);

  const stopVM = useCallback(async (vmId: string) => {
    try {
      const response = await fetch('/api/proximox/vms/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vmId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop VM');
      }

      await fetchVMs(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop VM');
      return false;
    }
  }, [fetchVMs]);

  const restartVM = useCallback(async (vmId: string) => {
    try {
      const response = await fetch('/api/proximox/vms/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vmId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restart VM');
      }

      await fetchVMs(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart VM');
      return false;
    }
  }, [fetchVMs]);

  useEffect(() => {
    if (!isConnected) return;

    fetchVMs();
    const interval = setInterval(fetchVMs, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchVMs, refreshInterval, isConnected]);

  return { 
    vms, 
    loading, 
    error, 
    refetch: fetchVMs,
    startVM,
    stopVM,
    restartVM,
  };
}

export function useClusterStatus(refreshInterval = 15000) {
  const { isConnected } = useProximoX();
  const [cluster, setCluster] = useState<ProximoXCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCluster = useCallback(async () => {
    if (!isConnected) return;

    try {
      setError(null);
      const response = await fetch('/api/proximox/cluster');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cluster status');
      }
      
      const data = await response.json();
      setCluster(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cluster status');
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) return;

    fetchCluster();
    const interval = setInterval(fetchCluster, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchCluster, refreshInterval, isConnected]);

  return { cluster, loading, error, refetch: fetchCluster };
}