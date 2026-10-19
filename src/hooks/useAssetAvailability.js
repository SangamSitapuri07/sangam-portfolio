import { useEffect, useState } from 'react'
import { checkLocalAsset } from '../utils/assetCheck.js'

// Check the local model before booting WebGL. SPA hosts can return index.html
// with status 200 for a missing binary, so status alone is not sufficient.
export function useAssetAvailability(url, enabled, onUnavailable) {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()

    checkLocalAsset(url, { signal: controller.signal }).then((ok) => {
      if (controller.signal.aborted) return
      if (ok) setAvailable(true)
      else onUnavailable()
    })
    return () => controller.abort()
  }, [url, enabled, onUnavailable])

  return enabled && available
}
