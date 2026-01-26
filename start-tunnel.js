/**
 * Cloudflare Tunnel Starter
 * Keeps the tunnel running and shows the URL
 */

import { spawn } from 'child_process';

const port = process.argv[2] || 5176;

console.log(`🚀 Starting Cloudflare tunnel for localhost:${port}...\n`);

const tunnel = spawn('npx', ['cloudflared', 'tunnel', '--url', `http://localhost:${port}`], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
});

let tunnelUrl = null;

tunnel.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);

  // Extract tunnel URL
  const match = output.match(/https:\/\/[a-z-]+\.trycloudflare\.com/);
  if (match && !tunnelUrl) {
    tunnelUrl = match[0];
    console.log('\n' + '='.repeat(60));
    console.log(`✅ TUNNEL URL: ${tunnelUrl}`);
    console.log('='.repeat(60));
    console.log('\n📱 Copy this URL and use it in your Telegram bot!');
    console.log('🔗 Bot: https://t.me/GPTnew4bot\n');
  }
});

tunnel.stderr.on('data', (data) => {
  const output = data.toString();
  // Filter out noisy logs
  if (!output.includes('INF') || output.includes('trycloudflare.com')) {
    console.error(output);
  }

  // Also check stderr for URL
  const match = output.match(/https:\/\/[a-z-]+\.trycloudflare\.com/);
  if (match && !tunnelUrl) {
    tunnelUrl = match[0];
    console.log('\n' + '='.repeat(60));
    console.log(`✅ TUNNEL URL: ${tunnelUrl}`);
    console.log('='.repeat(60));
    console.log('\n📱 Copy this URL and use it in your Telegram bot!');
    console.log('🔗 Bot: https://t.me/GPTnew4bot\n');
  }
});

tunnel.on('close', (code) => {
  console.log(`Tunnel process exited with code ${code}`);
  if (code !== 0) {
    console.log('Restarting tunnel in 3 seconds...');
    setTimeout(() => {
      spawn(process.argv[0], [process.argv[1], port], { stdio: 'inherit' });
    }, 3000);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Stopping tunnel...');
  tunnel.kill();
  process.exit(0);
});

console.log('Press Ctrl+C to stop the tunnel.\n');
