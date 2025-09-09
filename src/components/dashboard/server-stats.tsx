'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServerStats } from '@/hooks/use-proximox';
import { Cpu, HardDrive, MemoryStick, Network, Clock, Activity } from 'lucide-react';

function StatCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  usage, 
  isLoading 
}: {
  title: string;
  value: string;
  unit: string;
  icon: any;
  usage?: number;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold transition-all duration-300 ease-in-out">
          {isLoading ? (
            <div className="animate-pulse bg-muted h-6 w-16 rounded" />
          ) : (
            <span className="transition-all duration-300 ease-in-out">{`${value} ${unit}`}</span>
          )}
        </div>
        {usage !== undefined && (
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  usage > 80 ? 'bg-red-500' : usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${usage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {usage.toFixed(1)}% usage
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ServerStats() {
  const { stats, loading, error } = useServerStats(5000);

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
      <StatCard
        title="CPU Usage"
        value={stats?.cpu.usage.toFixed(1) || '0'}
        unit="%"
        icon={Cpu}
        usage={stats?.cpu.usage}
        isLoading={loading}
      />
      
      <StatCard
        title="Memory"
        value={stats ? formatBytes(stats.memory.used) : '0'}
        unit={`/ ${stats ? formatBytes(stats.memory.total) : '0'} GB`}
        icon={MemoryStick}
        usage={stats?.memory.usage}
        isLoading={loading}
      />
      
      <StatCard
        title="Disk Usage"
        value={stats ? formatBytes(stats.disk.used) : '0'}
        unit={`/ ${stats ? formatBytes(stats.disk.total) : '0'} TB`}
        icon={HardDrive}
        usage={stats?.disk.usage}
        isLoading={loading}
      />
      
      <StatCard
        title="Network In"
        value={stats ? formatBytes(stats.network.bytesIn) : '0'}
        unit="B/s"
        icon={Network}
        isLoading={loading}
      />
      
      <StatCard
        title="Load Average"
        value={stats?.loadAverage?.[0]?.toFixed?.(2) || '0.00'}
        unit=""
        icon={Activity}
        isLoading={loading}
      />
      
      <StatCard
        title="Uptime"
        value={stats ? formatUptime(stats.uptime) : '0'}
        unit=""
        icon={Clock}
        isLoading={loading}
      />
    </div>
  );
}