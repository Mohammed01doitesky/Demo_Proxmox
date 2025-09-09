'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Server, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network,
  Power,
  PowerOff,
  RotateCcw,
  Monitor,
  Settings
} from 'lucide-react';
import { ClusterOverview } from '@/components/dashboard/cluster-overview';
import { useVirtualMachines } from '@/hooks/use-proximox';
import { VirtualMachine } from '@/lib/proximox-client';

interface VMFormData {
  name: string;
  os: string;
  cpu: number;
  memory: number;
  disk: number;
  description?: string;
}

function CreateVMDialog({ onVMCreated }: { onVMCreated: (vm: VMFormData) => void }) {
  const [formData, setFormData] = useState<VMFormData>({
    name: '',
    os: 'ubuntu-22.04',
    cpu: 2,
    memory: 4096,
    disk: 50,
    description: ''
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVMCreated(formData);
    setIsOpen(false);
    setFormData({
      name: '',
      os: 'ubuntu-22.04',
      cpu: 2,
      memory: 4096,
      disk: 50,
      description: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create VM
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Create New Virtual Machine
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vm-name">VM Name</Label>
              <Input
                id="vm-name"
                placeholder="web-server-01"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vm-os">Operating System</Label>
              <Select value={formData.os} onValueChange={(value) => setFormData(prev => ({ ...prev, os: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ubuntu-22.04">Ubuntu 22.04 LTS</SelectItem>
                  <SelectItem value="ubuntu-20.04">Ubuntu 20.04 LTS</SelectItem>
                  <SelectItem value="centos-9">CentOS Stream 9</SelectItem>
                  <SelectItem value="centos-8">CentOS Stream 8</SelectItem>
                  <SelectItem value="debian-12">Debian 12</SelectItem>
                  <SelectItem value="debian-11">Debian 11</SelectItem>
                  <SelectItem value="windows-server-2022">Windows Server 2022</SelectItem>
                  <SelectItem value="windows-server-2019">Windows Server 2019</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vm-cpu" className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                CPU Cores
              </Label>
              <Input
                id="vm-cpu"
                type="number"
                min="1"
                max="32"
                value={formData.cpu.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, cpu: parseInt(e.target.value) || 2 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vm-memory" className="flex items-center gap-1">
                <MemoryStick className="h-3 w-3" />
                Memory (MB)
              </Label>
              <Input
                id="vm-memory"
                type="number"
                min="512"
                max="32768"
                step="512"
                value={formData.memory.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, memory: parseInt(e.target.value) || 4096 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vm-disk" className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Disk (GB)
              </Label>
              <Input
                id="vm-disk"
                type="number"
                min="10"
                max="1000"
                value={formData.disk.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, disk: parseInt(e.target.value) || 50 }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vm-description">Description (Optional)</Label>
            <Textarea
              id="vm-description"
              placeholder="Enter a description for this VM..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create VM</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VMCard({ vm }: { vm: VirtualMachine }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              {vm.name}
            </CardTitle>
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
              <span>{vm.cpu.toFixed(1)}% CPU</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
              <span>{(vm.memory / 1024).toFixed(1)} GB RAM</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span>{vm.disk} GB Disk</span>
            </div>
          </div>
        </div>

        {vm.ip && (
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">{vm.ip}</span>
            </div>
          </div>
        )}

        <div className="text-sm">
          <span className="text-muted-foreground">Uptime: </span>
          <span>{vm.uptime === 0 ? 'Stopped' : Math.floor(vm.uptime / (1000 * 60 * 60)) + 'h'}</span>
        </div>

        <div className="flex gap-2 pt-2">
          {vm.status === 'running' ? (
            <>
              <Button size="sm" variant="outline" className="flex-1">
                <PowerOff className="h-3 w-3 mr-1" />
                Stop
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <RotateCcw className="h-3 w-3 mr-1" />
                Restart
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="flex-1">
              <Power className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}
          <Button size="sm" variant="outline">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClusterPage() {
  const { vms, loading, error } = useVirtualMachines();

  const handleVMCreated = async (vmData: VMFormData) => {
    try {
      const response = await fetch('/api/proximox/vms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vmData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('VM created successfully:', result);
        // Show success message (you could add a toast notification here)
        alert(`VM "${vmData.name}" created successfully with ID: ${result.vmId}`);
        // Optionally refresh the VM list
        window.location.reload();
      } else {
        console.error('Failed to create VM:', result);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        alert(`Failed to create VM: ${result.error || result.details || response.statusText || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating VM:', error);
      alert('Failed to create VM. Please check the console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Server className="h-8 w-8" />
                Cluster Management
              </h1>
              <p className="text-muted-foreground">
                Manage your DOIT Hypervisor cluster and virtual machines
              </p>
            </div>
            <CreateVMDialog onVMCreated={handleVMCreated} />
          </div>
        </div>

        <div className="space-y-8">
          {/* Cluster Overview */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Network className="h-5 w-5" />
              Cluster Overview
            </h2>
            <ClusterOverview />
          </div>

          {/* Virtual Machines Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Virtual Machines
              </h2>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Total: {vms.length}</span>
                <span>•</span>
                <span>Running: {vms.filter((vm: VirtualMachine) => vm.status === 'running').length}</span>
                <span>•</span>
                <span>Stopped: {vms.filter((vm: VirtualMachine) => vm.status === 'stopped').length}</span>
              </div>
            </div>

            {error && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="text-center text-red-500">
                    Failed to load virtual machines: {error}
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && vms.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Loading virtual machines...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vms.map((vm: VirtualMachine) => (
                  <VMCard key={vm.id} vm={vm} />
                ))}
              </div>
            )}

            {!loading && vms.length === 0 && !error && (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Virtual Machines</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by creating your first virtual machine
                    </p>
                    <CreateVMDialog onVMCreated={handleVMCreated} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}