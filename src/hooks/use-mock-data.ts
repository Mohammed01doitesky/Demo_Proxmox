'use client';

import { useState, useEffect, useCallback } from 'react';
import { ServerStats, VirtualMachine, ProximoXCluster } from '@/lib/proximox-client';
import { 
  generateMockServerStats, 
  generateMockVMs, 
  mockClusterData 
} from '@/lib/mock-data';

// Mock hooks for demo dashboard
export function useMockServerStats(refreshInterval = 5000) {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  const fetchStats = useCallback((isInitial = false) => {
    if (isInitial) {
      // Only show loading delay on initial load
      setTimeout(() => {
        setStats(generateMockServerStats());
        setLoading(false);
      }, 500);
    } else {
      // For refreshes, update immediately without loading state
      setStats(generateMockServerStats());
    }
  }, []);

  useEffect(() => {
    fetchStats(true); // Initial load with loading state
    const interval = setInterval(() => {
      fetchStats(false); // Refreshes without loading state
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, error, refetch: () => fetchStats(false) };
}

export function useMockVirtualMachines(refreshInterval = 10000) {
  const [vms, setVMs] = useState<VirtualMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVMs = useCallback((isInitial = false) => {
    if (isInitial) {
      // Only show loading delay on initial load
      setTimeout(() => {
        setVMs(generateMockVMs());
        setLoading(false);
      }, 800);
    } else {
      // For refreshes, update immediately without loading state
      setVMs(generateMockVMs());
    }
  }, []);

  const startVM = useCallback(async (vmId: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVMs(current => 
        current.map(vm => 
          vm.id === vmId 
            ? { ...vm, status: 'running' as const, uptime: Date.now() }
            : vm
        )
      );
      return true;
    } catch (err) {
      setError('Failed to start VM');
      return false;
    }
  }, []);

  const stopVM = useCallback(async (vmId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVMs(current => 
        current.map(vm => 
          vm.id === vmId 
            ? { ...vm, status: 'stopped' as const, cpu: 0, uptime: 0 }
            : vm
        )
      );
      return true;
    } catch (err) {
      setError('Failed to stop VM');
      return false;
    }
  }, []);

  const restartVM = useCallback(async (vmId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setVMs(current => 
        current.map(vm => 
          vm.id === vmId 
            ? { ...vm, status: 'running' as const, uptime: Date.now() }
            : vm
        )
      );
      return true;
    } catch (err) {
      setError('Failed to restart VM');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchVMs(true); // Initial load with loading state
    const interval = setInterval(() => {
      fetchVMs(false); // Refreshes without loading state
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchVMs, refreshInterval]);

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

export function useMockClusterStatus(refreshInterval = 15000) {
  const [cluster, setCluster] = useState<ProximoXCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  const fetchCluster = useCallback(() => {
    setTimeout(() => {
      // Add some dynamic variation to cluster data
      const dynamicCluster = {
        ...mockClusterData,
        nodes: mockClusterData.nodes.map(node => ({
          ...node,
          cpu: node.status === 'online' ? 
            Math.max(10, Math.min(80, node.cpu + (Math.random() - 0.5) * 15)) : 0,
          memory: node.status === 'online' ? 
            Math.max(20, Math.min(90, node.memory + (Math.random() - 0.5) * 10)) : 0,
        })),
      };
      
      setCluster(dynamicCluster);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
    fetchCluster();
    const interval = setInterval(fetchCluster, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchCluster, refreshInterval]);

  return { cluster, loading, error, refetch: fetchCluster };
}

export function useMockProximoX() {
  const [isConnected] = useState(true);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    // Mock always connected for demo
    return true;
  }, []);

  return {
    client: null, // Mock client not needed
    isConnected,
    isLoading,
    error,
    checkConnection,
  };
}