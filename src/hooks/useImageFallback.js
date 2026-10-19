import { useCallback, useEffect, useRef, useState } from 'react'

export function useImageFallback(source) {
  const imageRef = useRef(null)
  const [failedSource, setFailedSource] = useState(null)
  const handleError = useCallback(() => setFailedSource(source), [source])

  useEffect(() => {
    // Prerendered/preloaded images can fail before hydration attaches onError.
    const image = imageRef.current
    if (source && image?.complete && image.naturalWidth === 0) setFailedSource(source)
  }, [source])

  return { imageRef, failed: !source || failedSource === source, handleError }
}
