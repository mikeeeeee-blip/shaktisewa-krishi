/**
 * Get ngrok public URL from ngrok API
 * Ngrok runs on localhost:4040 by default
 */
export async function getNgrokUrl(): Promise<string | null> {
  try {
    // Try to get ngrok tunnel info from ngrok API
    const response = await fetch('http://localhost:4040/api/tunnels', {
      signal: AbortSignal.timeout(2000),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.tunnels && data.tunnels.length > 0) {
        // Find the first https tunnel (prefer https)
        const httpsTunnel = data.tunnels.find((t: any) => t.proto === 'https');
        const tunnel = httpsTunnel || data.tunnels[0];
        
        if (tunnel && tunnel.public_url) {
          const url = tunnel.public_url.replace(/\/+$/, ''); // Remove trailing slashes
          console.log('✅ Detected ngrok URL:', url);
          return url;
        }
      }
    }
  } catch (error: any) {
    // Ngrok not running or not accessible - this is fine for production
    if (error.name !== 'AbortError' && !error.message?.includes('ECONNREFUSED')) {
      console.warn('⚠️ Could not detect ngrok URL:', error.message);
    }
  }
  
  return null;
}

/**
 * Get public URL for callbacks/webhooks
 * Priority: PAYU_PUBLIC_TEST_URL > NGROK_URL env var > detect from ngrok API > frontendUrl
 */
export async function getPublicCallbackUrl(frontendUrl: string): Promise<string> {
  // Check environment variable first
  if (process.env.PAYU_PUBLIC_TEST_URL) {
    return process.env.PAYU_PUBLIC_TEST_URL.replace(/\/+$/, '');
  }
  
  if (process.env.NGROK_URL) {
    return process.env.NGROK_URL.replace(/\/+$/, '');
  }
  
  // If frontendUrl is already public (not localhost), use it
  if (frontendUrl && !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
    return frontendUrl.replace(/\/+$/, '');
  }
  
  // Try to detect ngrok URL dynamically
  const ngrokUrl = await getNgrokUrl();
  if (ngrokUrl) {
    return ngrokUrl;
  }
  
  // Fallback to frontendUrl (might be localhost, but we'll handle it)
  return frontendUrl ? frontendUrl.replace(/\/+$/, '') : '';
}

