import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'proximox-dashboard',
      version: '1.0.0'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Health check failed' 
      }, 
      { status: 500 }
    );
  }
}