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
    const serverStats = await client.getServerStats();
    return NextResponse.json(serverStats);
  } catch (error) {
    console.error('Failed to fetch server stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}