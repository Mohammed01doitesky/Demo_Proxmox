import { NextRequest, NextResponse } from 'next/server';
import { ProximoXClient } from '@/lib/proximox-client';

const defaultConfig = {
  host: process.env.NEXT_PUBLIC_PROXIMOX_HOST || 'localhost',
  port: parseInt(process.env.NEXT_PUBLIC_PROXIMOX_PORT || '8006'),
  protocol: (process.env.NEXT_PUBLIC_PROXIMOX_PROTOCOL as 'http' | 'https') || 'https',
  username: process.env.NEXT_PUBLIC_PROXIMOX_USERNAME || '',
  password: process.env.NEXT_PUBLIC_PROXIMOX_PASSWORD || '',
};

export async function POST(request: NextRequest) {
  try {
    const vmData = await request.json();
    console.log('Received VM creation request:', vmData);

    // Validate required fields
    if (!vmData.name || !vmData.os || !vmData.cpu || !vmData.memory || !vmData.disk) {
      console.error('Missing required fields:', { name: !!vmData.name, os: !!vmData.os, cpu: !!vmData.cpu, memory: !!vmData.memory, disk: !!vmData.disk });
      return NextResponse.json(
        { error: 'Missing required fields: name, os, cpu, memory, disk' },
        { status: 400 }
      );
    }

    const client = new ProximoXClient(defaultConfig);
    console.log('DOIT client created, attempting to create VM...');
    
    // Create VM configuration
    const vmConfig = {
      name: vmData.name,
      ostype: vmData.os,
      cores: vmData.cpu,
      memory: vmData.memory,
      disk: vmData.disk,
      description: vmData.description || '',
      // Additional default settings
      net0: 'virtio,bridge=vmbr0',
      ide2: 'none,media=cdrom',
      boot: 'order=scsi0;ide2;net0',
      agent: 1,
      balloon: 0
    };

    console.log('VM configuration:', vmConfig);
    const result = await client.createVM(vmConfig);
    console.log('VM creation result:', result);
    
    return NextResponse.json({
      success: true,
      message: `VM ${vmData.name} created successfully`,
      vmId: result.vmId,
      data: result
    });

  } catch (error) {
    console.error('Failed to create VM:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create VM', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}