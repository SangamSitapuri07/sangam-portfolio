import { ArrowDown, ArrowUp, ArrowUpRight, Code2, Layers, Cpu, GitBranch, Send, Check, Download } from 'lucide-react'
import { SCENES, STORY_PROJECT_IDS, STORY_COPY, TECHNICAL_IDENTITY } from '../data/story.js'
import { PERSONAL } from '../data/personal.js'
import { getProjectById } from '../data/projects.js'
import { SKILLS } from '../data/skills.js'
import { TIMELINE, ACHIEVEMENTS } from '../data/timeline.js'
import { LAPTOP_ASSET } from '../config/assets.js'
import ActionLink from '../components/ui/ActionLink.jsx'
import LaptopPoster from '../components/scene/LaptopPoster.jsx'
import ProjectCard from '../components/story/ProjectCard.jsx'
import CaseStudy from '../components/story/CaseStudy.jsx'

const icons = [Code2, Layers, Cpu, GitBranch]
const projects = STORY_PROJECT_IDS.map(getProjectById).filter(Boolean)

function SceneHeading({ scene, children }) {
  return <><p className="scene-kicker"><span>{String(SCENES.indexOf(scene) + 1).padStart(2, '0')}</span><i aria-hidden="true" />{scene.title}</p><h2 id={`title-${scene.id}`}>{children || scene.headline}</h2></>
}

function Diagram() {
  return <div className="fallback-exploded" aria-label="Diagram of display, keycaps, illustrative engineering core, and chassis"><div>01 / DISPLAY ASSEMBLY</div><span aria-hidden="true" /><div>02 / ORIGINAL KEYCAPS</div><span aria-hidden="true" /><div className="diagram-core">03 / ILLUSTRATIVE ENGINEERING CORE</div><span aria-hidden="true" /><div>04 / ORIGINAL CHASSIS</div></div>
}

function StoryContent({ scene, cinematic, onOpenProject, featuredProjectId, onFeatureProject }) {
  switch (scene.id) {
    case 'home': return <>
      <div className="hero-topline"><span className="protocol-tag"><i className="signal-dot" />THE BREAKDOWN PROTOCOL</span><span className="edition-label">A DEVELOPER, DECONSTRUCTED / {new Date().getFullYear()}</span></div>
      <div className="hero-copy">
        <p className="hero-role">{PERSONAL.title}</p>
        <h1 id="title-home" aria-label={PERSONAL.name}>{PERSONAL.firstName}<br />{PERSONAL.lastName}<span>.</span></h1>
        <p className="hero-manifesto">Turning ideas into<br /><strong>intelligent experiences.</strong></p>
        <p className="scene-description">{PERSONAL.introduction}</p>
        <div className="hero-actions"><ActionLink href="#projects" variant="primary">Explore my work</ActionLink><ActionLink href={PERSONAL.resume} download={PERSONAL.resumeFilename}>Download résumé</ActionLink></div>
        <a className="understated-link" href="#about">The person behind the code<ArrowUpRight size={14} aria-hidden="true" /></a>
      </div>
      {!cinematic && <figure className="reading-hero-model"><LaptopPoster /><figcaption>A quieter workspace / Motion simplified</figcaption></figure>}
      <div className="hero-bottomline"><a href="#machine" className="scroll-cue"><span><ArrowDown size={15} aria-hidden="true" /></span>Scroll to break it down</a><p>ONE MACHINE<span>10 SCENES</span>YOUR PACE</p><span className="tiny-coordinates">EST. 2024 / IN PROGRESS</span></div>
    </>
    case 'machine': return <>
      <SceneHeading scene={scene}>Every line of code<br />has a <em>purpose.</em></SceneHeading>
      <p className="scene-description">{STORY_COPY[scene.id]}</p>
      <ul className="identity-tech-list" aria-label="Technical identity">{TECHNICAL_IDENTITY.map((tech, i) => <li key={tech}><span>{String(i + 1).padStart(2, '0')}</span>{tech}</li>)}</ul>
      <div className="engineering-note"><Code2 size={18} aria-hidden="true" /><p>From logical problem-solving to interactive interfaces. Every detail is part of the engineering process.</p></div>
    </>
    case 'breakdown': return <>
      <SceneHeading scene={scene}>To understand<br />the system,<br /><em>break it down.</em></SceneHeading>
      <p className="scene-description">{STORY_COPY[scene.id]}</p>
      <div className="component-register"><div><span>01</span>Display assembly<i>ORIGINAL</i></div><div><span>02</span>Keycaps & deck<i>ORIGINAL</i></div><div><span>03</span>Engineering core<i>ILLUSTRATIVE</i></div><div><span>04</span>Chassis<i>ORIGINAL</i></div></div>
      <p className="provenance-note">Original exterior meshes + an added, illustrative PCB. The supplied asset has no separately identified motherboard, fan, or battery.</p>
      {!cinematic && <Diagram />}
      <p className="scene-transition-note"><span />A system is easier to understand when you can see its parts.</p>
    </>
    case 'skills': return <>
      <SceneHeading scene={scene}>Logic is the foundation.<br /><em>Engineering is the craft.</em></SceneHeading>
      <p className="scene-description">{STORY_COPY[scene.id]}</p>
      <div className="core-skills-grid">{SKILLS.map((group, index) => { const Icon = icons[index]; return <article key={group.id}><Icon size={19} strokeWidth={1.4} aria-hidden="true" /><h3>{group.label}</h3><p>{group.description}</p><ul>{group.items.map((tech) => <li key={tech}>{tech}</li>)}</ul></article> })}</div>
      <div className="core-concepts"><span>THE THINKING UNDERNEATH</span><p>Data structures & algorithms / Problem solving / Algorithm design</p></div>
      <p className="provenance-note">Visual anchor: illustrative engineering core, added to the original laptop.</p>
    </>
    case 'projects': return <>
      <SceneHeading scene={scene}>Ideas become real<br />when you <em>build them.</em></SceneHeading>
      <div className="section-intro-line"><p>Different problems. Different platforms.<br />The same instinct to make something work.</p><span>04 SELECTED SYSTEMS / OPEN TO EXPLORE</span></div>
      <div className="project-universe">{projects.map((project) => <ProjectCard key={project.id} project={project} onOpen={onOpenProject} onFeature={onFeatureProject} />)}</div>
    </>
    case 'deep-dive': return <>
      <SceneHeading scene={scene}>Built to solve.<br /><em>Designed to evolve.</em></SceneHeading>
      <p className="scene-description">{STORY_COPY[scene.id]}</p>
      <CaseStudy project={getProjectById(featuredProjectId)} onOpen={onOpenProject} onSelect={onFeatureProject} />
    </>
    case 'reassembly': return <>
      <SceneHeading scene={scene}>Every component<br />has a <em>role.</em></SceneHeading>
      <p className="scene-description">{STORY_COPY[scene.id]}</p>
      <div className="reassembly-console"><div><span className="signal-dot" />REASSEMBLY PROTOCOL</div><p><Check size={13} />Same components. Same reference transforms.</p><p><Check size={13} />Nothing lost. Nothing guessed.</p><p><Check size={13} />One complete system.</p><code>understand → connect → build</code></div>
      <p className="scene-transition-note"><span />Scroll back. The system remembers every position.</p>
    </>
    case 'about': return <>
      <SceneHeading scene={scene}>Always learning.<br /><em>Always building.</em></SceneHeading>
      <p className="about-introduction">{PERSONAL.about.summary}</p>
      <div className="education-record"><span>{PERSONAL.education.period}</span><h3>{PERSONAL.education.institution}</h3><p>{PERSONAL.education.degree}</p><strong>CGPA {PERSONAL.education.cgpa}</strong></div>
      <div className="mindset-line"><span>CURIOUS BY DEFAULT.</span><p>I learn by building. On AI Debate Coach, I collaborated with two teammates while focusing on AI integration and backend development.</p></div>
      <div className="credential-heading"><h3>Learning, put into practice.</h3><span>CV-BACKED / TRAINING & CERTIFICATIONS</span></div>
      <div className="credentials-grid">{TIMELINE.map((item) => <a key={item.id} href={item.credentialUrl} target="_blank" rel="noopener noreferrer"><span>{item.date} / {item.organisation}</span><strong>{item.title}</strong><ArrowUpRight size={15} aria-hidden="true" /></a>)}</div>
      <div className="achievement-strip">{ACHIEVEMENTS.map((item) => <div key={item.id}><strong>{item.title}</strong><p>{item.description}</p></div>)}</div>
    </>
    case 'contact': return <>
      <SceneHeading scene={scene}>Have an idea?<br /><em>Let’s build it.</em></SceneHeading>
      <p className="scene-description">{STORY_COPY[scene.id]}</p>
      <a className="transmission-email" href={`mailto:${PERSONAL.contact.email}`}>{PERSONAL.contact.email}<Send size={20} strokeWidth={1.5} aria-hidden="true" /></a>
      <div className="contact-actions"><ActionLink href={`mailto:${PERSONAL.contact.email}`} variant="primary">Say hello</ActionLink><ActionLink href={PERSONAL.contact.github} external>GitHub</ActionLink><ActionLink href={PERSONAL.contact.linkedin} external>LinkedIn</ActionLink><ActionLink href={PERSONAL.resume} download={PERSONAL.resumeFilename}>Download résumé</ActionLink></div>
      <div className="transmission-status"><span className="signal-dot" />END OF THE PROTOCOL. START OF A CONVERSATION.</div>
    </>
    case 'afterglow': { const credit = LAPTOP_ASSET.attribution; return <>
      <SceneHeading scene={scene}>The next build<br /><em>starts here.</em></SceneHeading>
      <p className="afterglow-signature">{PERSONAL.name}<span>Developer & builder. Still curious.</span></p>
      <div className="afterglow-actions"><a href="#home">Back to the beginning<ArrowUp size={16} aria-hidden="true" /></a><a href="#projects">Revisit the work<ArrowUpRight size={16} aria-hidden="true" /></a></div>
      <footer className="protocol-footer">
        <div className="footer-navigation"><a href="#home">Home</a><a href="#skills">Skills</a><a href="#projects">Work</a><a href="#about">About</a><a href="#contact">Contact</a></div>
        <div className="footer-socials"><a href={PERSONAL.contact.github} target="_blank" rel="noopener noreferrer">GitHub</a><a href={PERSONAL.contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a><a href={`mailto:${PERSONAL.contact.email}`}>Email</a><a href={PERSONAL.resume} download={PERSONAL.resumeFilename}>Résumé<Download size={12} aria-hidden="true" /></a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {PERSONAL.name}</span><span>DESIGNED TO BE TAKEN APART.</span></div>
        <p className="model-credit"><a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">{credit.title}</a> by <a href={credit.authorUrl} target="_blank" rel="noopener noreferrer">{credit.author}</a> · <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">{credit.license}</a> · Lighting, screen display, and assembly motion adapted. Added PCB is illustrative.</p>
      </footer>
    </> }
    default: return null
  }
}

export default function StorySections({ cinematic, onOpenProject, featuredProjectId, onFeatureProject }) {
  return <div id="story" className="story-track">{SCENES.map((scene, index) => <section id={scene.id} key={scene.id} className={`story-scene story-scene--${scene.id} ${['projects', 'deep-dive'].includes(scene.id) ? 'scene-wide' : ''}`} style={{ '--scene-span': scene.span }} data-scene-index={index} aria-labelledby={`title-${scene.id}`}><div className="scene-content"><StoryContent scene={scene} cinematic={cinematic} onOpenProject={onOpenProject} featuredProjectId={featuredProjectId} onFeatureProject={onFeatureProject} /></div></section>)}</div>
}
