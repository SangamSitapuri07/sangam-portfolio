import { useImageFallback } from '../../hooks/useImageFallback.js'
import { Plus } from 'lucide-react'
import './ProjectMedia.css'

export default function ProjectMedia({ project, variant = 'card', pipelineLabel = '', loading = 'lazy' }) {
  const source = project.media?.poster
  const { imageRef, failed: fallback, handleError } = useImageFallback(source)
  const screenshot = project.media?.kind === 'screenshot'
  const caption = fallback
    ? 'PROJECT OVERVIEW / PREVIEW UNAVAILABLE'
    : screenshot ? 'ACTUAL PROJECT INTERFACE' : 'SYSTEM SKETCH / NOT A SCREENSHOT'

  return (
    <span className={`project-media project-media--${variant}`} data-media-state={fallback ? 'fallback' : 'image'}>
      {fallback ? (
        <span className="project-media-summary" role="img" aria-label={`${project.title} project overview; image preview unavailable`}>
          <span className="media-summary-label">SOURCE-BACKED PROJECT OVERVIEW</span>
          <strong>{project.title}</strong>
          <span className="media-summary-description">{project.summary}</span>
          <span className="media-summary-tech">{project.technologies.slice(0, 4).join(' / ')}</span>
        </span>
      ) : (
        <img ref={imageRef} src={source} alt={project.media.alt || `${project.title} project visual`} width="960" height="600" loading={loading} decoding="async" onError={handleError} />
      )}
      {variant === 'card' && <span className="preview-caption">{caption}<Plus size={16} aria-hidden="true" /></span>}
      {variant === 'case' && <span className="case-visual-caption"><span>{caption}</span><span>{pipelineLabel}</span></span>}
      {variant === 'dialog' && <span className="media-provenance">{fallback ? 'Preview unavailable. The project overview, details, and supplied links remain accessible.' : screenshot ? 'Actual project interface, captured from the project source.' : 'Editorial architecture sketch based on project documentation—not an application screenshot.'}</span>}
    </span>
  )
}
