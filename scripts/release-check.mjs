import { spawn } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
for (const script of ['check', 'test:e2e']) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(npm, ['run', script], {
      stdio: 'inherit',
      env: { ...process.env, ...(script === 'test:e2e' ? { PLAYWRIGHT_PRODUCTION: '1' } : {}) },
      shell: process.platform === 'win32',
    })
    child.on('error', reject)
    child.on('exit', (status) => resolve(status ?? 1))
  })
  if (code !== 0) { process.exitCode = code; break }
}
