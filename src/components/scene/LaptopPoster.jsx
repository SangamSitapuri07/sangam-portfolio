import { useId } from 'react'
import { useImageFallback } from '../../hooks/useImageFallback.js'
import { LAPTOP_ASSET } from '../../config/assets.js'

export default function LaptopPoster({ className = '' }) {
  const { imageRef, failed, handleError } = useImageFallback(LAPTOP_ASSET.poster)
  const gradient = useId()
  if (failed) {
    return (
      <svg className={`laptop-poster poster-outline ${className}`} viewBox="0 0 1100 800" aria-hidden="true" data-poster-state="illustration">
        <defs><linearGradient id={gradient} x2="1" y2="1"><stop stopColor="#153240" /><stop offset="1" stopColor="#0b141e" /></linearGradient></defs>
        <path d="m285 215 490-54 42 330-488 54Z" fill={`url(#${gradient})`} stroke="#4d9db1" strokeWidth="3" />
        <path d="m309 234 445-49 35 285-443 50Z" fill="#081019" stroke="#294e63" strokeWidth="2" />
        <path d="m329 545 488-54 171 124-545 75-219-98Z" fill={`url(#${gradient})`} stroke="#4d9db1" strokeWidth="3" />
        <path d="m382 553 394-42 98 68-420 54Z" fill="#0b1722" stroke="#32697e" strokeWidth="2" />
        <path d="m494 648 164-21 40 23-171 23Z" fill="#132d3b" stroke="#35667d" strokeWidth="2" />
        <path d="m416 303 208-22m-204 53 294-32m-289 64 251-27" stroke="#4597aa" strokeWidth="4" opacity=".6" />
        <text x="550" y="745" fill="#a2bfce" fontFamily="sans-serif" fontSize="16" textAnchor="middle" letterSpacing="2">SIMPLIFIED LAPTOP ILLUSTRATION</text>
      </svg>
    )
  }
  return <img ref={imageRef} className={`laptop-poster ${className}`} src={LAPTOP_ASSET.poster} alt="" aria-hidden="true" width="1100" height="800" decoding="async" onError={handleError} />
}
