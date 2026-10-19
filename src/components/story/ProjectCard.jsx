import { ArrowUpRight } from 'lucide-react'

import { getCaseStudy } from '../../data/caseStudies.js'
import ProjectMedia from './ProjectMedia.jsx'

export default function ProjectCard({ project, onOpen, onFeature }) {
  return (
    <article className={`universe-card universe-card--${project.id}`}>
      <button className="project-preview-button" type="button" onClick={() => onOpen(project.id)} aria-label={`View ${project.title} details`}>
        <ProjectMedia project={project} variant="card" />
      </button>
      <div className="universe-card-copy">
        <p className="micro-label">{project.category}{project.date ? ` / ${project.date}` : ''}</p>
        <div className="project-card-title"><h3>{project.title}</h3><button type="button" onClick={() => onOpen(project.id)} aria-label={`Read ${project.title} project details`}><ArrowUpRight size={22} aria-hidden="true" /></button></div>
        <p>{project.summary}</p>
        <ul className="tech-tags" aria-label={`${project.title} technologies`}>{project.technologies.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="project-links">
          {project.links.github && <a href={project.links.github} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.title} source on GitHub (opens in a new tab)`}>Source<ArrowUpRight size={13} aria-hidden="true" /></a>}
          {project.links.live && <a href={project.links.live} target="_blank" rel="noopener noreferrer" aria-label={`${project.demoLabel} for ${project.title} (opens in a new tab)`}>{project.demoLabel}<ArrowUpRight size={13} aria-hidden="true" /></a>}
          {getCaseStudy(project.id) && <a className="project-case-link" href="#deep-dive" onClick={() => onFeature(project.id)} aria-label={`Explore ${project.title} case study`}>Case study<ArrowUpRight size={13} aria-hidden="true" /></a>}
        </div>
      </div>
    </article>
  )
}
