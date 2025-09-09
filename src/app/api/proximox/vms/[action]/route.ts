import { NextRequest, NextResponse } from 'next/server';
import { ProximoXClient } from '@/lib/proximox-client';

const defaultConfig = {
  host: process.env.NEXT_PUBLIC_PROXIMOX_HOST || 'localhost',
  port: parseInt(process.env.NEXT_PUBLIC_PROXIMOX_PORT || '8006'),
  protocol: (process.env.NEXT_PUBLIC_PROXIMOX_PROTOCOL as 'http' | 'https') || 'https',
  username: process.env.NEXT_PUBLIC_PROXIMOX_USERNAME || '',
  password: process.env.NEXT_PUBLIC_PROXIMOX_PASSWORD || '',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;
    const { vmId } = await request.json();

    if (!vmId) {
      return NextResponse.json(
        { error: 'VM ID is required' },
        { status: 400 }
      );
    }

    const client = new ProximoXClient(defaultConfig);

    switch (action) {
      case 'start':
        await client.startVM(vmId);
        return NextResponse.json({ success: true, message: `VM ${vmId} started` });
      
      case 'stop':
        await client.stopVM(vmId);
        return NextResponse.json({ success: true, message: `VM ${vmId} stopped` });
      
      case 'restart':
        await client.restartVM(vmId);
        return NextResponse.json({ success: true, message: `VM ${vmId} restarted` });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use start, stop, or restart' },
          { status: 400 }
        );
    }
  } catch (error) {
    const { action } = await params;
    console.error(`Failed to ${action} VM:`, error);
    return NextResponse.json(
      { error: `Failed to ${action} VM`, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}