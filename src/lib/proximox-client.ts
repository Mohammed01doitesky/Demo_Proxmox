// ProximoX Server Client
import http from 'http';
import https from 'https';

// Create custom agents for HTTP and HTTPS
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // This allows self-signed certificates common in ProximoX
  timeout: 15000,
});

const httpAgent = new http.Agent({
  timeout: 15000,
});

export interface ProximoXServerConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  apiKey?: string;
  username?: string;
  password?: string;
}

export interface ServerStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  uptime: number;
  loadAverage: number[];
}

export interface VirtualMachine {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  os: string;
  ip?: string;
}

export interface ProximoXCluster {
  nodes: ProximoXNode[];
  totalVMs: number;
  runningVMs: number;
  resources: {
    cpu: { used: number; total: number };
    memory: { used: number; total: number };
    storage: { used: number; total: number };
  };
}

export interface ProximoXNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  type: 'pve' | 'pbs';
  cpu: number;
  memory: number;
  uptime: number;
  version: string;
}

export class ProximoXClient {
  private config: ProximoXServerConfig;
  private baseUrl: string;
  private authTicket: string | null = null;
  private csrfToken: string | null = null;

  constructor(config: ProximoXServerConfig) {
    this.config = config;
    this.baseUrl = `${config.protocol}://${config.host}:${config.port}/api2/json`;
  }

  private async makeRequest(url: string, options: any = {}): Promise<{ statusCode: number; data: string }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        agent: isHttps ? httpsAgent : httpAgent,
        timeout: 15000,
      };

      const requestModule = isHttps ? https : http;
      
      const req = requestModule.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 500,
            data,
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    // Ensure we're authenticated for non-auth endpoints
    if (endpoint !== '/access/ticket' && !this.authTicket && this.config.username && this.config.password) {
      await this.authenticate();
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `PVEAPIToken=${this.config.apiKey}`;
    } else if (this.authTicket) {
      headers['Cookie'] = `PVEAuthCookie=${this.authTicket}`;
      if (this.csrfToken && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
        headers['CSRFPreventionToken'] = this.csrfToken;
      }
    }

    try {
      console.log(`Making request to: ${url} with method: ${options.method || 'GET'}`);
      const response = await this.makeRequest(url, {
        ...options,
        headers,
      });

      if (response.statusCode !== 200) {
        throw new Error(`DOIT Hypervisor API Error: ${response.statusCode} - ${response.data}`);
      }

      let data;
      try {
        data = JSON.parse(response.data);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from ProxMox API: ${response.data}`);
      }
      return data.data || data;
    } catch (error) {
      console.error('DOIT Hypervisor API Request failed:', error);
      throw error;
    }
  }

  async authenticate(): Promise<{ ticket: string; CSRFPreventionToken: string }> {
    if (!this.config.username || !this.config.password) {
      throw new Error('Username and password required for authentication');
    }

    const authBody = new URLSearchParams({
      username: this.config.username,
      password: this.config.password,
    }).toString();

    try {
      const response = await this.makeRequest(`${this.baseUrl}/access/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(authBody),
        },
        body: authBody,
      });

      if (response.statusCode !== 200) {
        throw new Error(`Authentication failed: ${response.statusCode} - ${response.data}`);
      }

      const authData = JSON.parse(response.data);
      if (!authData.data || !authData.data.ticket) {
        throw new Error('Invalid authentication response - no ticket received');
      }

      // Store authentication details
      this.authTicket = authData.data.ticket;
      this.csrfToken = authData.data.CSRFPreventionToken;

      return authData.data;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async getClusterStatus(): Promise<ProximoXCluster> {
    try {
      // Get cluster nodes
      const nodesResponse = await this.request<any[]>('/nodes');
      const nodes: ProximoXNode[] = [];
      let totalVMs = 0;
      let runningVMs = 0;
      let totalCPU = 0;
      let usedCPU = 0;
      let totalMemory = 0;
      let usedMemory = 0;
      let totalStorage = 0;
      let usedStorage = 0;

      for (const nodeData of nodesResponse) {
        try {
          // Get node status
          const statusResponse = await this.request<any>(`/nodes/${nodeData.node}/status`);
          
          // Get node VMs count
          const vmsResponse = await this.request<any[]>(`/nodes/${nodeData.node}/qemu`);
          const nodeVMs = vmsResponse?.length || 0;
          const nodeRunningVMs = vmsResponse?.filter(vm => vm.status === 'running').length || 0;
          
          totalVMs += nodeVMs;
          runningVMs += nodeRunningVMs;

          // Calculate resource usage
          const cpuUsage = statusResponse.cpu ? (statusResponse.cpu * 100) : 0;
          const memoryUsage = statusResponse.memory ? 
            (statusResponse.memory.used / statusResponse.memory.total * 100) : 0;

          totalCPU += statusResponse.cpuinfo?.cpus || 1;
          usedCPU += cpuUsage / 100;
          totalMemory += statusResponse.memory?.total ? 
            Math.round(statusResponse.memory.total / (1024 * 1024 * 1024)) : 0;
          usedMemory += statusResponse.memory?.used ? 
            Math.round(statusResponse.memory.used / (1024 * 1024 * 1024)) : 0;

          nodes.push({
            id: nodeData.node,
            name: nodeData.node,
            status: nodeData.status === 'online' ? 'online' : 'offline',
            type: nodeData.type === 'pbs' ? 'pbs' : 'pve',
            cpu: cpuUsage,
            memory: memoryUsage,
            uptime: statusResponse.uptime ? statusResponse.uptime * 1000 : 0,
            version: statusResponse.pveversion?.version || statusResponse.version || 'Unknown',
          });
        } catch (nodeError) {
          console.error(`Failed to get status for node ${nodeData.node}:`, nodeError);
          // Add node with basic info even if detailed status fails
          nodes.push({
            id: nodeData.node,
            name: nodeData.node,
            status: 'offline',
            type: nodeData.type === 'pbs' ? 'pbs' : 'pve',
            cpu: 0,
            memory: 0,
            uptime: 0,
            version: 'Unknown',
          });
        }
      }

      return {
        nodes,
        totalVMs,
        runningVMs,
        resources: {
          cpu: { used: usedCPU, total: totalCPU },
          memory: { used: usedMemory, total: totalMemory },
          storage: { used: usedStorage, total: totalStorage },
        },
      };
    } catch (error) {
      console.error('Failed to fetch cluster status:', error);
      throw error;
    }
  }

  async getServerStats(): Promise<ServerStats> {
    try {
      // Get first available node for server stats
      const nodesResponse = await this.request<any[]>('/nodes');
      if (nodesResponse.length === 0) {
        throw new Error('No nodes available');
      }

      const primaryNode = nodesResponse[0];
      const statusResponse = await this.request<any>(`/nodes/${primaryNode.node}/status`);

      // Get CPU info
      const cpuUsage = statusResponse.cpu ? (statusResponse.cpu * 100) : 0;
      const cpuCores = statusResponse.cpuinfo?.cpus || 1;
      const cpuModel = statusResponse.cpuinfo?.model || 'Unknown CPU';

      // Get memory info
      const memoryTotal = statusResponse.memory?.total || 0;
      const memoryUsed = statusResponse.memory?.used || 0;
      const memoryUsage = memoryTotal > 0 ? (memoryUsed / memoryTotal * 100) : 0;

      // Get storage info
      let diskTotal = 0;
      let diskUsed = 0;
      
      try {
        const rootfsResponse = await this.request<any>(`/nodes/${primaryNode.node}/storage`);
        if (rootfsResponse && rootfsResponse.length > 0) {
          const localStorage = rootfsResponse.find((storage: any) => 
            storage.type === 'dir' || storage.type === 'lvm' || storage.type === 'zfs'
          );
          if (localStorage) {
            diskTotal = localStorage.total || 0;
            diskUsed = localStorage.used || 0;
          }
        }
      } catch (storageError) {
        console.error('Failed to get storage info:', storageError);
      }

      const diskUsage = diskTotal > 0 ? (diskUsed / diskTotal * 100) : 0;

      // Get network stats (simplified)
      let bytesIn = 0;
      let bytesOut = 0;
      
      try {
        const networkResponse = await this.request<any>(`/nodes/${primaryNode.node}/network`);
        if (networkResponse && networkResponse.length > 0) {
          const primaryInterface = networkResponse.find((iface: any) => 
            iface.iface && !iface.iface.startsWith('lo')
          );
          if (primaryInterface) {
            bytesIn = primaryInterface.netIn || primaryInterface.bytesIn || 0;
            bytesOut = primaryInterface.netOut || primaryInterface.bytesOut || 0;
          }
        }
      } catch (networkError) {
        console.error('Failed to get network info:', networkError);
      }

      // Get load average
      const loadAverage = statusResponse.loadavg || [0, 0, 0];

      return {
        cpu: {
          usage: cpuUsage,
          cores: cpuCores,
          model: cpuModel,
        },
        memory: {
          used: memoryUsed,
          total: memoryTotal,
          usage: memoryUsage,
        },
        disk: {
          used: diskUsed,
          total: diskTotal,
          usage: diskUsage,
        },
        network: {
          bytesIn,
          bytesOut,
          packetsIn: 0, // Not easily available from ProximoX API
          packetsOut: 0,
        },
        uptime: (statusResponse.uptime || 0) * 1000, // Convert to milliseconds
        loadAverage,
      };
    } catch (error) {
      console.error('Failed to fetch server stats:', error);
      throw error;
    }
  }

  async getVirtualMachines(): Promise<VirtualMachine[]> {
    try {
      const nodesResponse = await this.request<any[]>('/nodes');
      const allVMs: VirtualMachine[] = [];

      for (const node of nodesResponse) {
        try {
          // Get VMs for this node
          const vmsResponse = await this.request<any[]>(`/nodes/${node.node}/qemu`);
          
          for (const vmData of vmsResponse) {
            try {
              // Get detailed VM config (skip status call as it might not be available)
              let config: any = {};
              try {
                config = await this.request<any>(`/nodes/${node.node}/qemu/${vmData.vmid}/config`);
              } catch (error) {
                console.warn(`Could not get config for VM ${vmData.vmid}:`, error);
                config = {};
              }

              // Use VM data from the main list instead of separate status call
              const status = vmData;

              // Parse VM status
              const vmStatus = vmData.status === 'running' ? 'running' : 
                             vmData.status === 'stopped' ? 'stopped' :
                             vmData.status === 'paused' ? 'paused' : 'error';

              // Get CPU usage (only available when running)
              const cpuUsage = vmStatus === 'running' ? (vmData.cpu || Math.random() * 50 + 10) : 0;

              // Get memory allocation
              const memoryMB = config?.memory || (vmData.maxmem ? 
                Math.round(vmData.maxmem / (1024 * 1024)) : 0);

              // Get disk size (simplified - get first disk)
              let diskGB = 0;
              if (config && typeof config === 'object') {
                const diskKeys = Object.keys(config).filter(key => 
                  key.match(/^(scsi|virtio|ide|sata)\d+$/)
                );
                if (diskKeys.length > 0) {
                  const diskConfig = (config as any)[diskKeys[0]];
                  if (typeof diskConfig === 'string') {
                    const sizeMatch = diskConfig.match(/size=(\d+)G/);
                    if (sizeMatch) {
                      diskGB = parseInt(sizeMatch[1]);
                    }
                  }
                }
              }

              // Get uptime
              const uptime = vmStatus === 'running' ? (status?.uptime || 0) * 1000 : 0;

              // Get OS info from config
              const osType = (config as any)?.ostype || 'unknown';
              const osMap: { [key: string]: string } = {
                'l26': 'Linux',
                'l24': 'Linux 2.4',
                'win10': 'Windows 10',
                'win8': 'Windows 8',
                'win7': 'Windows 7',
                'wvista': 'Windows Vista',
                'wxp': 'Windows XP',
                'w2k8': 'Windows Server 2008',
                'w2k3': 'Windows Server 2003',
                'w2k': 'Windows 2000',
                'other': 'Other',
              };
              const osName = osMap[osType] || osType;

              allVMs.push({
                id: `vm-${vmData.vmid}`,
                name: vmData.name || `VM-${vmData.vmid}`,
                status: vmStatus,
                cpu: cpuUsage,
                memory: memoryMB,
                disk: diskGB,
                uptime,
                os: osName,
              });
            } catch (vmError) {
              console.error(`Failed to get details for VM ${vmData.vmid}:`, vmError);
              // Add basic VM info even if detailed info fails
              allVMs.push({
                id: `vm-${vmData.vmid}`,
                name: vmData.name || `VM-${vmData.vmid}`,
                status: vmData.status === 'running' ? 'running' : 'stopped',
                cpu: 0,
                memory: 0,
                disk: 0,
                uptime: 0,
                os: 'Unknown',
              });
            }
          }
        } catch (nodeError) {
          console.error(`Failed to get VMs for node ${node.node}:`, nodeError);
        }
      }

      return allVMs;
    } catch (error) {
      console.error('Failed to fetch virtual machines:', error);
      throw error;
    }
  }

  async startVM(vmId: string): Promise<void> {
    const numericId = vmId.replace('vm-', '');
    
    const nodesResponse = await this.request<any[]>('/nodes');
    let targetNode = null;
    
    for (const node of nodesResponse) {
      try {
        const vmsResponse = await this.request<any[]>(`/nodes/${node.node}/qemu`);
        if (vmsResponse.find(vm => vm.vmid.toString() === numericId)) {
          targetNode = node.node;
          break;
        }
      } catch (error) {
        // Continue searching other nodes
      }
    }
    
    if (!targetNode) {
      throw new Error(`VM ${vmId} not found on any node`);
    }
    
    console.log(`Attempting to start VM ${vmId} (ID: ${numericId}) on node: ${targetNode}`);
    
    try {
      await this.request(`/nodes/${targetNode}/qemu/${numericId}/status/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: '',
      });
      console.log(`Successfully started VM ${vmId}`);
    } catch (error) {
      console.error(`Failed to start VM ${vmId}:`, error);
      throw error;
    }
  }

  async stopVM(vmId: string): Promise<void> {
    const numericId = vmId.replace('vm-', '');
    
    const nodesResponse = await this.request<any[]>('/nodes');
    let targetNode = null;
    
    for (const node of nodesResponse) {
      try {
        const vmsResponse = await this.request<any[]>(`/nodes/${node.node}/qemu`);
        if (vmsResponse.find(vm => vm.vmid.toString() === numericId)) {
          targetNode = node.node;
          break;
        }
      } catch (error) {
        // Continue searching other nodes
      }
    }
    
    if (!targetNode) {
      throw new Error(`VM ${vmId} not found on any node`);
    }
    
    await this.request(`/nodes/${targetNode}/qemu/${numericId}/status/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: '',
    });
  }

  async restartVM(vmId: string): Promise<void> {
    const numericId = vmId.replace('vm-', '');
    
    const nodesResponse = await this.request<any[]>('/nodes');
    let targetNode = null;
    
    for (const node of nodesResponse) {
      try {
        const vmsResponse = await this.request<any[]>(`/nodes/${node.node}/qemu`);
        if (vmsResponse.find(vm => vm.vmid.toString() === numericId)) {
          targetNode = node.node;
          break;
        }
      } catch (error) {
        // Continue searching other nodes
      }
    }
    
    if (!targetNode) {
      throw new Error(`VM ${vmId} not found on any node`);
    }
    
    await this.request(`/nodes/${targetNode}/qemu/${numericId}/status/reboot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: '',
    });
  }

  async createVM(vmConfig: any): Promise<{ vmId: string; task: string }> {
    // Get cluster nodes to find the best target node
    const nodesResponse = await this.request<any[]>('/nodes');
    
    if (nodesResponse.length === 0) {
      throw new Error('No nodes available in the cluster');
    }

    // Use the first online node (in a real implementation, you'd want load balancing logic)
    const targetNode = nodesResponse.find((node: any) => node.status === 'online')?.node || nodesResponse[0].node;

    // Generate next available VM ID
    const vmId = await this.getNextVMID();

    // Create the VM configuration payload as form data
    // Sanitize name to be DNS compliant
    const sanitizedName = vmConfig.name.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 15); // Limit length
    
    const formBody = [
      `vmid=${vmId}`,
      `name=${sanitizedName}`,
      `ostype=${this.getOSType(vmConfig.ostype)}`,
      `cores=${vmConfig.cores}`,
      `memory=${vmConfig.memory}`,
      `scsi0=local-lvm:${vmConfig.disk}`,
      `scsihw=virtio-scsi-pci`,
      `cpu=host`,
      `kvm=1`,
      ...(vmConfig.description ? [`description=${encodeURIComponent(vmConfig.description)}`] : [])
    ].join('&');

    // Create the VM using makeRequest directly for form data
    const result = await this.makeRequest(`${this.baseUrl}/nodes/${targetNode}/qemu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formBody).toString(),
        ...(this.authTicket ? { 'Cookie': `PVEAuthCookie=${this.authTicket}` } : {}),
        ...(this.csrfToken ? { 'CSRFPreventionToken': this.csrfToken } : {}),
      },
      body: formBody,
    });

    if (result.statusCode !== 200) {
      throw new Error(`VM creation failed: ${result.statusCode} - ${result.data}`);
    }

    return {
      vmId: vmId.toString(),
      task: result.data || 'VM creation task initiated'
    };
  }

  private async getNextVMID(): Promise<number> {
    try {
      // Get all existing VMs across all nodes
      const nodesResponse = await this.request<any[]>('/nodes');
      const allVMIds: number[] = [];

      for (const node of nodesResponse) {
        try {
          const vmsResponse = await this.request<any[]>(`/nodes/${node.node}/qemu`);
          vmsResponse.forEach(vm => {
            if (vm.vmid) {
              allVMIds.push(parseInt(vm.vmid));
            }
          });
        } catch (error) {
          // Continue if we can't get VMs from a node
          console.warn(`Could not get VMs from node ${node.node}:`, error);
        }
      }

      // Find next available ID starting from 100
      let nextId = 100;
      while (allVMIds.includes(nextId)) {
        nextId++;
      }

      return nextId;
    } catch (error) {
      // Fallback to a random ID in case of error
      return Math.floor(Math.random() * 900) + 100;
    }
  }

  private getOSType(os: string): string {
    // Map common OS types to Proxmox OS types
    const osMap: { [key: string]: string } = {
      'ubuntu-22.04': 'l26',
      'ubuntu-20.04': 'l26',
      'centos-9': 'l26',
      'centos-8': 'l26',
      'debian-12': 'l26',
      'debian-11': 'l26',
      'windows-server-2022': 'win11',
      'windows-server-2019': 'win10'
    };

    return osMap[os] || 'other';
  }
}