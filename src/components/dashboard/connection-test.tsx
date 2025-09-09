'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle, XCircle, AlertTriangle, Server } from 'lucide-react';

interface ConnectionTestResult {
  success: boolean;
  server?: string;
  version?: any;
  authenticated?: boolean;
  ticket?: string;
  message?: string;
  error?: string;
  status?: number;
}

export function ConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/proximox/test-connection');
      const data = await response.json();
      
      setResult({
        success: response.ok,
        ...data
      });
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to test connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (testing) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    
    if (!result) {
      return <Wifi className="h-5 w-5 text-muted-foreground" />;
    }

    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    if (result.status === 401) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }

    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (testing) return 'Testing connection...';
    if (!result) return 'Ready to test';
    if (result.success) return 'Connected successfully';
    if (result.status === 401) return 'Authentication failed';
    if (result.status === 408) return 'Connection timeout';
    return 'Connection failed';
  };

  const getStatusColor = () => {
    if (testing) return 'bg-blue-500';
    if (!result) return 'bg-gray-500';
    if (result.success) return 'bg-green-500';
    if (result.status === 401) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          DOIT Hypervisor Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge variant="outline" className={`${getStatusColor()} text-white border-0`}>
            {result?.server || 'Not tested'}
          </Badge>
        </div>

        <Button 
          onClick={testConnection} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="text-sm space-y-2">
              {result.success ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Server:</span>
                    <span className="font-mono">{result.server}</span>
                  </div>
                  {result.version && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span className="font-mono">
                        {result.version.version || 'Unknown'}
                        {result.version.release && ` (${result.version.release})`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authentication:</span>
                    <span className={result.authenticated ? 'text-green-600' : 'text-red-600'}>
                      {result.authenticated ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                  {result.ticket && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ticket:</span>
                      <span className="text-green-600">✓ Obtained</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-red-600 font-medium">
                    {result.error}
                  </div>
                  {result.message && (
                    <div className="text-sm text-muted-foreground">
                      {result.message}
                    </div>
                  )}
                  {result.server && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attempted:</span>
                      <span className="font-mono">{result.server}</span>
                    </div>
                  )}
                  {result.status && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HTTP Status:</span>
                      <span className="font-mono">{result.status}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {result?.success && (
          <div className="p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 Connection successful! Your DOIT Hypervisor dashboard is ready to use.
            </p>
          </div>
        )}

        {result && !result.success && result.status === 401 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Server is reachable but authentication failed. Please check your credentials.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}