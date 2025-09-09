// Mock data for demo dashboard
import { ServerStats, VirtualMachine, ProximoXCluster } from './proximox-client';

export const mockServerStats: ServerStats = {
  cpu: {
    usage: 45.2,
    cores: 16,
    model: 'Intel Xeon E5-2680 v4',
  },
  memory: {
    used: 64 * 1024 * 1024 * 1024, // 64GB in bytes
    total: 128 * 1024 * 1024 * 1024, // 128GB in bytes
    usage: 50.0,
  },
  disk: {
    used: 2.4 * 1024 * 1024 * 1024 * 1024, // 2.4TB in bytes
    total: 10 * 1024 * 1024 * 1024 * 1024, // 10TB in bytes
    usage: 24.0,
  },
  network: {
    bytesIn: 1024 * 1024 * 1024, // 1GB
    bytesOut: 2 * 1024 * 1024 * 1024, // 2GB
    packetsIn: 1000000,
    packetsOut: 1500000,
  },
  uptime: 3600000 * 24 * 15, // 15 days
  loadAverage: [1.2, 1.5, 1.8],
};

export const mockVirtualMachines: VirtualMachine[] = [
  {
    id: 'vm-100',
    name: 'web-server-01',
    status: 'running',
    cpu: 25.4,
    memory: 4096,
    disk: 50,
    uptime: 3600000 * 24 * 7, // 7 days
    os: 'Ubuntu 22.04 LTS',
    ip: '192.168.1.100',
  },
  {
    id: 'vm-101',
    name: 'database-master',
    status: 'running',
    cpu: 67.8,
    memory: 8192,
    disk: 200,
    uptime: 3600000 * 24 * 12, // 12 days
    os: 'CentOS Stream 9',
    ip: '192.168.1.101',
  },
  {
    id: 'vm-102',
    name: 'backup-server',
    status: 'stopped',
    cpu: 0,
    memory: 2048,
    disk: 500,
    uptime: 0,
    os: 'Debian 12',
  },
  {
    id: 'vm-103',
    name: 'load-balancer',
    status: 'running',
    cpu: 12.3,
    memory: 1024,
    disk: 20,
    uptime: 3600000 * 24 * 30, // 30 days
    os: 'Alpine Linux 3.18',
    ip: '192.168.1.103',
  },
  {
    id: 'vm-104',
    name: 'monitoring-stack',
    status: 'running',
    cpu: 34.7,
    memory: 6144,
    disk: 100,
    uptime: 3600000 * 24 * 5, // 5 days
    os: 'Ubuntu 22.04 LTS',
    ip: '192.168.1.104',
  },
  {
    id: 'vm-105',
    name: 'dev-environment',
    status: 'paused',
    cpu: 0,
    memory: 4096,
    disk: 80,
    uptime: 3600000 * 2, // 2 hours
    os: 'Fedora 39',
    ip: '192.168.1.105',
  },
  {
    id: 'vm-106',
    name: 'ci-cd-runner',
    status: 'error',
    cpu: 0,
    memory: 2048,
    disk: 40,
    uptime: 0,
    os: 'Ubuntu 20.04 LTS',
  },
];

export const mockClusterData: ProximoXCluster = {
  nodes: [
    {
      id: 'node1',
      name: 'proximox-node-01',
      status: 'online',
      type: 'pve',
      cpu: 45.2,
      memory: 67.8,
      uptime: 3600000 * 24 * 20, // 20 days
      version: '8.1.4',
    },
    {
      id: 'node2',
      name: 'proximox-node-02',
      status: 'online',
      type: 'pve',
      cpu: 32.1,
      memory: 54.3,
      uptime: 3600000 * 24 * 18, // 18 days
      version: '8.1.4',
    },
    {
      id: 'node3',
      name: 'proximox-node-03',
      status: 'maintenance',
      type: 'pve',
      cpu: 0,
      memory: 0,
      uptime: 0,
      version: '8.1.3',
    },
    {
      id: 'backup1',
      name: 'proximox-backup-01',
      status: 'online',
      type: 'pbs',
      cpu: 15.6,
      memory: 32.1,
      uptime: 3600000 * 24 * 25, // 25 days
      version: '3.1.2',
    },
  ],
  totalVMs: mockVirtualMachines.length,
  runningVMs: mockVirtualMachines.filter(vm => vm.status === 'running').length,
  resources: {
    cpu: { used: 12.8, total: 64 },
    memory: { used: 96, total: 256 },
    storage: { used: 4.8, total: 20 },
  },
};

// Generate dynamic mock data with some randomness
export const generateMockServerStats = (): ServerStats => {
  const baseStats = { ...mockServerStats };
  
  // Add some randomness to make it feel more alive
  baseStats.cpu.usage = Math.max(10, Math.min(90, baseStats.cpu.usage + (Math.random() - 0.5) * 10));
  baseStats.memory.usage = Math.max(20, Math.min(80, baseStats.memory.usage + (Math.random() - 0.5) * 8));
  baseStats.disk.usage = Math.max(10, Math.min(70, baseStats.disk.usage + (Math.random() - 0.5) * 5));
  baseStats.loadAverage = baseStats.loadAverage.map(load => 
    Math.max(0.1, Math.min(3.0, load + (Math.random() - 0.5) * 0.5))
  );
  
  return baseStats;
};

export const generateMockVMs = (): VirtualMachine[] => {
  return mockVirtualMachines.map(vm => ({
    ...vm,
    cpu: vm.status === 'running' ? 
      Math.max(5, Math.min(95, vm.cpu + (Math.random() - 0.5) * 20)) : 0,
  }));
};