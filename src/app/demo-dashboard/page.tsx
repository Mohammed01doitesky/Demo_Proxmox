'use client';

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

import { ServerStats } from '@/components/dashboard/server-stats';
import { VMList } from '@/components/dashboard/vm-list';
import { ClusterOverview } from '@/components/dashboard/cluster-overview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Zap, Info } from 'lucide-react';
import { VirtualMachine, ProximoXNode } from '@/lib/proximox-client';

// Demo components that use mock data
function DemoServerStats() {
  const { useMockServerStats } = require('@/hooks/use-mock-data');
  const { stats, loading, error } = useMockServerStats(5000);

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Failed to load server stats: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1);
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300 ease-in-out">
            {loading ? (
              <div className="animate-pulse bg-muted h-6 w-16 rounded" />
            ) : (
              <span className="transition-all duration-300 ease-in-out">{`${stats?.cpu.usage.toFixed(1) || '0'} %`}</span>
            )}
          </div>
          {stats?.cpu.usage !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    stats.cpu.usage > 80 ? 'bg-red-500' : stats.cpu.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${stats.cpu.usage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.cpu.cores} cores • {stats.cpu.model}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add other stat cards similarly */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300 ease-in-out">
            {loading ? (
              <div className="animate-pulse bg-muted h-6 w-16 rounded" />
            ) : (
              <span className="transition-all duration-300 ease-in-out">{`${stats ? formatBytes(stats.memory.used) : '0'} GB`}</span>
            )}
          </div>
          {stats?.memory.usage !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    stats.memory.usage > 80 ? 'bg-red-500' : stats.memory.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${stats.memory.usage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.memory.usage.toFixed(1)}% of {formatBytes(stats.memory.total)} GB
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add more cards for disk, network, etc. */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300 ease-in-out">
            {loading ? (
              <div className="animate-pulse bg-muted h-6 w-16 rounded" />
            ) : (
              <span className="transition-all duration-300 ease-in-out">{`${stats ? formatBytes(stats.disk.used) : '0'} TB`}</span>
            )}
          </div>
          {stats?.disk.usage !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    stats.disk.usage > 80 ? 'bg-red-500' : stats.disk.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${stats.disk.usage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.disk.usage.toFixed(1)}% of {formatBytes(stats.disk.total)} TB
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network In</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300 ease-in-out">
            {loading ? (
              <div className="animate-pulse bg-muted h-6 w-16 rounded" />
            ) : (
              <span className="transition-all duration-300 ease-in-out">{`${stats ? formatBytes(stats.network.bytesIn) : '0'} B/s`}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Load Average</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300 ease-in-out">
            {loading ? (
              <div className="animate-pulse bg-muted h-6 w-16 rounded" />
            ) : (
              <span className="transition-all duration-300 ease-in-out">{stats?.loadAverage?.[0]?.toFixed?.(2) || '0.00'}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300 ease-in-out">
            {loading ? (
              <div className="animate-pulse bg-muted h-6 w-16 rounded" />
            ) : (
              <span className="transition-all duration-300 ease-in-out">{stats ? formatUptime(stats.uptime) : '0'}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DemoVMList() {
  const { useMockVirtualMachines } = require('@/hooks/use-mock-data');
  const { vms, loading, error, startVM, stopVM, restartVM } = useMockVirtualMachines(10000);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Failed to load virtual machines: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading && vms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading virtual machines...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Virtual Machines</h2>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>Total: {vms.length}</span>
          <span>•</span>
          <span>Running: {vms.filter((vm: VirtualMachine) => vm.status === 'running').length}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vms.map((vm: VirtualMachine) => (
          <Card key={vm.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{vm.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{vm.id}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${
                    vm.status === 'running' ? 'bg-green-500' :
                    vm.status === 'stopped' ? 'bg-gray-500' :
                    vm.status === 'paused' ? 'bg-yellow-500' :
                    'bg-red-500'
                  } text-white border-0`}
                >
                  {vm.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span>{vm.os}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>{vm.cpu.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span>{(vm.memory / 1024).toFixed(1)} GB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span>{vm.disk} GB</span>
                  </div>
                </div>
              </div>

              {vm.ip && (
                <div className="text-sm">
                  <span className="text-muted-foreground">IP: </span>
                  <span className="font-mono">{vm.ip}</span>
                </div>
              )}

              <div className="text-sm">
                <span className="text-muted-foreground">Uptime: </span>
                <span>{vm.uptime === 0 ? 'Stopped' : Math.floor(vm.uptime / (1000 * 60 * 60)) + 'h'}</span>
              </div>

              {/* VM control buttons would go here but simplified for demo */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DemoClusterOverview() {
  const { useMockClusterStatus } = require('@/hooks/use-mock-data');
  const { cluster, loading, error } = useMockClusterStatus(15000);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Failed to load cluster status: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading && !cluster) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading cluster information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cluster) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">DOIT Cluster (Demo)</h2>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>Nodes: {cluster.nodes.length}</span>
          <span>•</span>
          <span>Online: {cluster.nodes.filter((n: ProximoXNode) => n.status === 'online').length}</span>
        </div>
      </div>

      {/* Resource overview and nodes would be rendered here */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cluster Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{cluster.runningVMs}</div>
              <p className="text-sm text-muted-foreground">Running VMs</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cluster.totalVMs}</div>
              <p className="text-sm text-muted-foreground">Total VMs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DemoDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">DOIT Hypervisor Demo Dashboard</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Demo Mode
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Interactive demo with simulated DOIT Hypervisor Data and Functionality
          </p>
        </div>

        {/* <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Demo Dashboard</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This dashboard is Demo,
                  All metrics update automatically with realistic variations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        <div className="space-y-8">
          {/* Server Stats */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Server Statistics</h2>
            <DemoServerStats />
          </div>

          {/* Cluster Overview */}
          <DemoClusterOverview />

          {/* Virtual Machines */}
          <DemoVMList />
        </div>
      </div>
    </div>
  );
}