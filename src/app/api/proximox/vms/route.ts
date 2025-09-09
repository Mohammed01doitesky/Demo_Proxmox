import { NextResponse } from 'next/server';
import { ProximoXClient } from '@/lib/proximox-client';

const defaultConfig = {
  host: process.env.NEXT_PUBLIC_PROXIMOX_HOST || 'localhost',
  port: parseInt(process.env.NEXT_PUBLIC_PROXIMOX_PORT || '8006'),
  protocol: (process.env.NEXT_PUBLIC_PROXIMOX_PROTOCOL as 'http' | 'https') || 'https',
  username: process.env.NEXT_PUBLIC_PROXIMOX_USERNAME || '',
  password: process.env.NEXT_PUBLIC_PROXIMOX_PASSWORD || '',
};

export async function GET() {
  try {
    const client = new ProximoXClient(defaultConfig);
    const virtualMachines = await client.getVirtualMachines();
    return NextResponse.json(virtualMachines);
  } catch (error) {
    console.error('Failed to fetch virtual machines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch virtual machines', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}