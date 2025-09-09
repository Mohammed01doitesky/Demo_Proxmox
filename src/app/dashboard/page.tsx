'use client';

import { ServerStats } from '@/components/dashboard/server-stats';
import { VMList } from '@/components/dashboard/vm-list';
import { ClusterOverview } from '@/components/dashboard/cluster-overview';
import { ConnectionTest } from '@/components/dashboard/connection-test';
import { useProximoX } from '@/hooks/use-proximox';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

function ConnectionStatus() {
  const { isConnected, isLoading, error, checkConnection } = useProximoX();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Connecting to DOIT Hypervisor server...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">Connected to DOIT Hypervisor</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">Disconnected</span>
                {error && (
                  <span className="text-sm text-muted-foreground">• {error}</span>
                )}
              </>
            )}
          </div>
          
          {!isConnected && (
            <button
              onClick={checkConnection}
              className="text-sm text-primary hover:underline"
            >
              Retry Connection
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { isConnected } = useProximoX();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">DOIT Hypervisor Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your DOIT Hypervisor virtualization environment
          </p>
        </div>

        <ConnectionStatus />

        {!isConnected ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Server Connection Required</h3>
                  <p className="text-muted-foreground mb-4">
                    Test your DOIT Hypervisor server connection and verify credentials.
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Current configuration:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2 font-mono text-xs">
                      <li>Host: {process.env.NEXT_PUBLIC_PROXIMOX_HOST || 'Not set'}</li>
                      <li>Port: {process.env.NEXT_PUBLIC_PROXIMOX_PORT || 'Not set'}</li>
                      <li>Protocol: {process.env.NEXT_PUBLIC_PROXIMOX_PROTOCOL || 'Not set'}</li>
                      <li>Username: {process.env.NEXT_PUBLIC_PROXIMOX_USERNAME || 'Not set'}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <ConnectionTest />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Server Stats */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Server Statistics</h2>
              <ServerStats />
            </div>

            {/* Cluster Overview */}
            <ClusterOverview />

            {/* Virtual Machines */}
            <VMList />
          </div>
        )}
      </div>
    </div>
  );
}