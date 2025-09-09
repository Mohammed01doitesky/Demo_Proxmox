'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVirtualMachines } from '@/hooks/use-proximox';
import { Play, Square, RotateCcw, Monitor, HardDrive, Cpu, MemoryStick } from 'lucide-react';
import { VirtualMachine } from '@/lib/proximox-client';
import { useState } from 'react';

function VMCard({ vm, onStart, onStop, onRestart }: {
  vm: VirtualMachine;
  onStart: (id: string) => Promise<boolean>;
  onStop: (id: string) => Promise<boolean>;
  onRestart: (id: string) => Promise<boolean>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => Promise<boolean>) => {
    setIsLoading(true);
    await action();
    setIsLoading(false);
  };

  const getStatusColor = (status: VirtualMachine['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-500';
      case 'paused': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatUptime = (ms: number) => {
    if (ms === 0) return 'Stopped';
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
            <CardTitle className="text-lg">{vm.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{vm.id}</p>
          </div>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(vm.status)} text-white border-0`}
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
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span>{vm.cpu.toFixed(1)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
              <span>{(vm.memory / 1024).toFixed(1)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
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
          <span>{formatUptime(vm.uptime)}</span>
        </div>

        <div className="flex gap-2">
          {vm.status === 'stopped' && (
            <Button
              size="sm"
              onClick={() => handleAction(() => onStart(vm.id))}
              disabled={isLoading}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          
          {vm.status === 'running' && (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction(() => onStop(vm.id))}
                disabled={isLoading}
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(() => onRestart(vm.id))}
                disabled={isLoading}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restart
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function VMList() {
  const { vms, loading, error, startVM, stopVM, restartVM } = useVirtualMachines(10000);

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
          <span>Running: {vms.filter(vm => vm.status === 'running').length}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vms.map((vm) => (
          <VMCard
            key={vm.id}
            vm={vm}
            onStart={startVM}
            onStop={stopVM}
            onRestart={restartVM}
          />
        ))}
      </div>

      {vms.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Virtual Machines</h3>
            <p className="text-muted-foreground">
              No virtual machines found on this DOIT Hypervisor server.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}