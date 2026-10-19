import { ASSET_CHECK_TIMEOUT_MS } from '../config/loading.js'

export async function checkLocalAsset(url, { signal, timeoutMs = ASSET_CHECK_TIMEOUT_MS, fetcher = fetch } = {}) {
  if (signal?.aborted) return false
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  let timer
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => { controller.abort(); resolve(false) }, timeoutMs)
  })
  const request = Promise.resolve().then(() => fetcher(url, { method: 'HEAD', signal: controller.signal })).then((response) => {
    const type = response.headers.get('content-type')?.toLowerCase() || ''
    const empty = response.headers.get('content-length') === '0'
    return response.ok && !type.includes('text/html') && !empty
  }).catch(() => false)
  try {
    return await Promise.race([request, deadline])
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}
