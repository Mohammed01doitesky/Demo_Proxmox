'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClusterStatus } from '@/hooks/use-proximox';
import { Server, Cpu, HardDrive, MemoryStick, Zap, Clock } from 'lucide-react';
import { ProximoXNode } from '@/lib/proximox-client';

function NodeCard({ node }: { node: ProximoXNode }) {
  const getStatusColor = (status: ProximoXNode['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-4 w-4" />
              {node.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{node.type.toUpperCase()} • v{node.version}</p>
          </div>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(node.status)} text-white border-0`}
          >
            {node.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                CPU
              </span>
              <span>{node.cpu.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  node.cpu > 80 ? 'bg-red-500' : node.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${node.cpu}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MemoryStick className="h-3 w-3" />
                RAM
              </span>
              <span>{node.memory.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  node.memory > 80 ? 'bg-red-500' : node.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${node.memory}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Uptime
          </span>
          <span>{formatUptime(node.uptime)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceOverview({ cluster }: { cluster: any }) {
  const cpuUsage = (cluster.resources.cpu.used / cluster.resources.cpu.total) * 100;
  const memoryUsage = (cluster.resources.memory.used / cluster.resources.memory.total) * 100;
  const storageUsage = (cluster.resources.storage.used / cluster.resources.storage.total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Cluster Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Cpu className="h-4 w-4" />
                CPU Cores
              </span>
              <span className="text-sm">
                {cluster.resources.cpu.used} / {cluster.resources.cpu.total}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  cpuUsage > 80 ? 'bg-red-500' : cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{cpuUsage.toFixed(1)}% used</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <MemoryStick className="h-4 w-4" />
                Memory (GB)
              </span>
              <span className="text-sm">
                {cluster.resources.memory.used} / {cluster.resources.memory.total}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  memoryUsage > 80 ? 'bg-red-500' : memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${memoryUsage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{memoryUsage.toFixed(1)}% used</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <HardDrive className="h-4 w-4" />
                Storage (TB)
              </span>
              <span className="text-sm">
                {cluster.resources.storage.used} / {cluster.resources.storage.total}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  storageUsage > 80 ? 'bg-red-500' : storageUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${storageUsage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{storageUsage.toFixed(1)}% used</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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
  );
}

export function ClusterOverview() {
  const { cluster, loading, error } = useClusterStatus(15000);

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
        <h2 className="text-2xl font-bold">DOIT Cluster</h2>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>Nodes: {cluster.nodes.length}</span>
          <span>•</span>
          <span>Online: {cluster.nodes.filter(n => n.status === 'online').length}</span>
        </div>
      </div>

      <ResourceOverview cluster={cluster} />

      <div>
        <h3 className="text-lg font-semibold mb-4">Cluster Nodes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cluster.nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}