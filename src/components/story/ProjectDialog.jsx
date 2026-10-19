import { useEffect, useRef } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { getCaseStudy, CASE_STUDY_TABS } from '../../data/caseStudies.js'
import { getProjectById } from '../../data/projects.js'
import ProjectMedia from './ProjectMedia.jsx'

export default function ProjectDialog({ projectId, onClose }) {
  const ref = useRef()
  const project = getProjectById(projectId)
  const study = getCaseStudy(projectId)
  useEffect(() => {
    if (!project) return
    const dialog = ref.current
    const focused = document.activeElement
    dialog.showModal()
    const close = () => onClose()
    dialog.addEventListener('close', close)
    return () => { dialog.removeEventListener('close', close); if (dialog.open) dialog.close(); focused?.focus() }
  }, [project, onClose])
  if (!project) return null
  return (
    <dialog ref={ref} className="project-dialog" aria-labelledby="project-dialog-title" data-lenis-prevent onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="dialog-inner">
        <div className="dialog-topline"><span className="micro-label">PROJECT DOSSIER / {project.date || 'SELECTED WORK'}</span><button type="button" className="dialog-close" onClick={onClose} aria-label="Close project details"><X size={22} /></button></div>
        <h2 id="project-dialog-title">{project.title}</h2><p className="dialog-summary">{project.summary}</p>
        <ProjectMedia project={project} variant="dialog" loading="eager" />
        <ul className="tech-tags">{project.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
        {study ? <div className="dialog-case-details">{CASE_STUDY_TABS.map(({ heading, id }) => <section key={id}><h3>{heading}</h3><p>{study[id]}</p></section>)}</div> : <ul className="project-highlights">{(project.highlights || [project.summary]).map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}
        <div className="dialog-links">{project.links.github && <a href={project.links.github} target="_blank" rel="noopener noreferrer">Source code<ArrowUpRight size={16} /></a>}{project.links.live && <a href={project.links.live} target="_blank" rel="noopener noreferrer">{project.demoLabel}<ArrowUpRight size={16} /></a>}</div>
      </div>
    </dialog>
  )
}
