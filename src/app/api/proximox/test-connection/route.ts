import { NextResponse } from 'next/server';
import http from 'http';
import https from 'https';

// Create a custom agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // This allows self-signed certificates
  timeout: 15000,
});

const httpAgent = new http.Agent({
  timeout: 15000,
});

async function makeRequest(url: string, options: any = {}) {
  return new Promise<{ statusCode: number; data: string }>((resolve, reject) => {
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

export async function GET() {
  const host = process.env.NEXT_PUBLIC_PROXIMOX_HOST;
  const port = process.env.NEXT_PUBLIC_PROXIMOX_PORT;
  const protocol = process.env.NEXT_PUBLIC_PROXIMOX_PROTOCOL;
  const username = process.env.NEXT_PUBLIC_PROXIMOX_USERNAME;
  const password = process.env.NEXT_PUBLIC_PROXIMOX_PASSWORD;

  if (!host || !port || !username || !password) {
    return NextResponse.json(
      { error: 'DOIT Hypervisor configuration incomplete', missing: [] },
      { status: 400 }
    );
  }

  const baseUrl = `${protocol}://${host}:${port}/api2/json`;

  try {
    console.log(`Testing DOIT Hypervisor connection to: ${protocol}://${host}:${port}`);

    // Test authentication first (some Proxmox servers require auth for all endpoints)
    const authBody = new URLSearchParams({
      username,
      password,
    }).toString();

    const authResponse = await makeRequest(`${baseUrl}/access/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(authBody),
      },
      body: authBody,
    });

    if (authResponse.statusCode !== 200) {
      console.error(`DOIT Hypervisor auth failed: ${authResponse.statusCode}`);
      console.error(`Auth response: ${authResponse.data}`);
      
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          status: authResponse.statusCode,
          server: `${host}:${port}`,
          details: authResponse.data,
          hint: authResponse.statusCode === 401 ? 'Check username and password' : 'Check server configuration'
        },
        { status: 401 }
      );
    }

    let authData;
    try {
      authData = JSON.parse(authResponse.data);
    } catch (parseError) {
      authData = { data: null };
    }
    
    console.log('DOIT Hypervisor authentication successful');

    // Now test version endpoint with authentication
    const ticket = authData.data?.ticket;
    const versionResponse = await makeRequest(`${baseUrl}/version`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `PVEAuthCookie=${ticket}`,
      },
    });

    let versionData;
    if (versionResponse.statusCode === 200) {
      try {
        versionData = JSON.parse(versionResponse.data);
      } catch (parseError) {
        versionData = { version: 'Unknown', response: versionResponse.data };
      }
      console.log('DOIT Hypervisor version check successful:', versionData);
    } else {
      versionData = { version: 'Unknown', status: versionResponse.statusCode };
    }

    return NextResponse.json({
      success: true,
      server: `${host}:${port}`,
      protocol,
      version: versionData.data || versionData,
      authenticated: true,
      ticket: ticket ? 'obtained' : 'missing',
      message: 'DOIT Hypervisor connection successful',
      username: username.split('@')[0], // Don't expose full credentials
    });

  } catch (error: any) {
    console.error('DOIT Hypervisor connection test failed:', error);
    
    let errorMessage = 'Unknown connection error';
    let errorCode = 500;
    
    if (error.message === 'Request timeout') {
      errorMessage = 'Connection timeout - server did not respond within 15 seconds';
      errorCode = 408;
    } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'CERT_HAS_EXPIRED') {
      errorMessage = 'SSL certificate error - this is common with self-signed certificates';
      errorCode = 526;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - check if DOIT Hypervisor is running and port is correct';
      errorCode = 503;
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_NONAME') {
      errorMessage = 'Host not found - check the IP address or hostname';
      errorCode = 404;
    } else if (error.code === 'ENETUNREACH') {
      errorMessage = 'Network unreachable - check network connectivity';
      errorCode = 503;
    } else if (error.code === 'EHOSTUNREACH') {
      errorMessage = 'Host unreachable - check if the server is online';
      errorCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        code: error.code,
        server: `${host}:${port}`,
        protocol,
        troubleshooting: [
          'Verify DOIT Hypervisor server is running',
          'Check IP address and port number: ' + `${host}:${port}`,
          'Ensure firewall allows connections to port ' + port,
          'Test from command line: curl -v ' + `${protocol}://${host}:${port}/api2/json/version`,
          protocol === 'http' ? 'Try using HTTPS if server requires it' : 'Try using HTTP if HTTPS has issues',
          'Check if server is behind a proxy or load balancer'
        ]
      },
      { status: errorCode }
    );
  }
}