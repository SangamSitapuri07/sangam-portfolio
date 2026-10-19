import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowUpRight, Menu, X, Image, Box } from 'lucide-react'
import { SCENES } from '../../data/story.js'
import { PERSONAL } from '../../data/personal.js'
import { subscribeScene, getActiveScene, getServerScene } from '../../animation/runtime.js'

const nav = [{ id: 'home', label: 'Home' }, { id: 'skills', label: 'Skills' }, { id: 'projects', label: 'Work' }, { id: 'about', label: 'About' }, { id: 'contact', label: 'Contact' }]

export default function Navigation({ cinematic, reducedMotion, onToggleView }) {
  const scene = useSyncExternalStore(subscribeScene, getActiveScene, getServerScene)
  const [open, setOpen] = useState(false)
  const menuButton = useRef()
  useEffect(() => {
    if (!open) return
    const close = (event) => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus() } }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])
  const activeId = scene <= 2 ? 'home' : scene === 3 ? 'skills' : scene <= 6 ? 'projects' : scene === 7 ? 'about' : 'contact'
  return (
    <>
      <header className="protocol-header">
        <div className="header-brand"><a href="#home" aria-label={`${PERSONAL.name}, home`} className="monogram">s<span>.</span></a><span className="header-edition">SANGAM SITAPURI<span>ENGINEERED, NOT ASSEMBLED.</span></span></div>
        <nav aria-label="Main navigation" className="desktop-navigation">
          {nav.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={activeId === item.id ? 'location' : undefined}>{item.label}</a>)}
        </nav>
        <div className="header-tools">
          {!reducedMotion && <button className="mode-button" type="button" onClick={onToggleView} aria-label={cinematic ? 'Use lightweight image view' : 'Use 3D studio view'} aria-pressed={!cinematic}>{cinematic ? <Image size={15} /> : <Box size={15} />}<span>{cinematic ? 'Reading view' : '3D view'}</span></button>}
          {reducedMotion && <span className="motion-badge">Reduced motion</span>}
          <a className="header-resume" href={PERSONAL.resume} download={PERSONAL.resumeFilename}>Résumé<ArrowUpRight size={14} aria-hidden="true" /></a>
          <button ref={menuButton} className="mobile-menu-button" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
        <div className="reading-progress" aria-hidden="true"><span /></div>
      </header>
      <nav id="mobile-navigation" className="mobile-navigation" aria-label="Scene navigation" hidden={!open}>
        {SCENES.map((item, index) => <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)} aria-current={scene === index ? 'location' : undefined}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}<ArrowUpRight size={16} aria-hidden="true" /></a>)}
      </nav>
      <nav className="scene-rail" aria-label="Journey chapters">
        {SCENES.map((item, index) => <a key={item.id} href={`#${item.id}`} className={scene === index ? 'is-active' : ''} aria-label={`Scene ${index + 1}: ${item.title}`} aria-current={scene === index ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><i aria-hidden="true" /><b>{item.title}</b></a>)}
      </nav>
      <div className="scene-status" aria-live="off"><span className="signal-dot" />{SCENES[scene].chapter}<span className="scene-status-name">{SCENES[scene].title}</span><span>{String(scene + 1).padStart(2, '0')} / 10</span></div>
    </>
  )
}
