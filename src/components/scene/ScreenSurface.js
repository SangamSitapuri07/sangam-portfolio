import { CanvasTexture, SRGBColorSpace } from 'three'
import { SCENES } from '../../data/story.js'
import { PERSONAL } from '../../data/personal.js'
import { getProjectById } from '../../data/projects.js'

function fittedText(ctx, text, x, y, initialSize, width, color) {
  let size = initialSize
  ctx.font = `500 ${size}px sans-serif`
  while (ctx.measureText(text).width > width && size > 18) ctx.font = `500 ${--size}px sans-serif`
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

export function createScreenSurface(onInvalidate = () => {}, onPresent = () => {}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = true
  texture.anisotropy = 4
  const previews = new Map()
  let key = '', alive = true

  function getPreview(project) {
    if (!project?.media.poster) return null
    if (previews.has(project.id)) return previews.get(project.id)
    const image = new Image()
    const preview = { image, status: 'loading' }
    previews.set(project.id, preview)
    image.decoding = 'async'
    const settled = () => {
      preview.status = image.naturalWidth > 0 ? 'ready' : 'error'
      if (!alive) return
      key = ''
      onInvalidate()
    }
    image.onload = settled
    image.onerror = settled
    // These are small local portfolio visuals, not demo URLs or APK downloads.
    // No project image is requested by this surface before its story beat.
    image.src = project.media.poster
    return preview
  }

  function draw(frame) {
    const projectScene = frame.scene === 4 || frame.scene === 5
    const project = getProjectById(frame.projectId)
    const preview = projectScene ? getPreview(project) : null
    const status = preview?.status || 'none'
    const nextKey = `${frame.scene}:${frame.projectId}:${status}`
    if (nextKey === key) return
    key = nextKey
    const scene = SCENES[frame.scene]
    ctx.fillStyle = '#071019'
    ctx.fillRect(0, 0, 1024, 1024)
    ctx.strokeStyle = '#102a37'
    ctx.lineWidth = 1
    for (let x = 40; x < 1024; x += 55) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke() }
    for (let y = 40; y < 1024; y += 55) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke() }
    ctx.fillStyle = '#10212b'
    ctx.fillRect(42, 44, 940, 66)
    ctx.fillStyle = '#63e8ed'
    ctx.font = '20px monospace'
    ctx.fillText(`${PERSONAL.initials} / SYSTEM ONLINE`, 68, 87)
    ctx.fillText(`${String(frame.scene + 1).padStart(2, '0')} — 10`, 812, 87)
    ctx.fillStyle = '#72f1f4'
    ctx.font = '23px monospace'
    ctx.fillText(`${scene.chapter.toUpperCase()} / PORTFOLIO`, 68, 188)

    if (projectScene && project) {
      fittedText(ctx, project.title, 68, 290, 72, 888, '#e8f9fb')
      ctx.fillStyle = '#0a1520'
      ctx.fillRect(68, 330, 888, 500)
      if (status === 'ready') {
        const image = preview.image
        const ratio = Math.min(888 / image.naturalWidth, 500 / image.naturalHeight)
        const width = image.naturalWidth * ratio, height = image.naturalHeight * ratio
        ctx.drawImage(image, 68 + (888 - width) / 2, 330 + (500 - height) / 2, width, height)
      } else {
        fittedText(ctx, 'PROJECT SUMMARY', 100, 415, 32, 820, '#a5d4df')
        project.technologies.slice(0, 5).forEach((item, index) => fittedText(ctx, item, 100, 480 + index * 57, 35, 800, '#d7eaf1'))
      }
      ctx.strokeStyle = '#2d6173'
      ctx.lineWidth = 2
      ctx.strokeRect(68, 330, 888, 500)
      ctx.font = '20px monospace'
      ctx.fillStyle = '#8cc7d7'
      ctx.fillText(status === 'ready' ? project.media.kind === 'screenshot' ? 'ACTUAL PROJECT INTERFACE' : 'SYSTEM SKETCH / NOT A SCREENSHOT' : 'CV / REPOSITORY-BACKED SUMMARY', 68, 875)
      fittedText(ctx, project.technologies.join(' / '), 68, 930, 23, 888, '#9bbdcd')
    } else {
      const lines = frame.scene === 0 ? [PERSONAL.firstName, `${PERSONAL.lastName}.`, 'Developer / Builder']
        : frame.scene === 2 ? ['BREAKDOWN', 'PROTOCOL', 'UNDERSTAND THE SYSTEM']
        : frame.scene === 3 ? ['ENGINEERING', 'CORE', 'Logic → Architecture → Code']
        : frame.scene === 6 ? ['REASSEMBLY', 'PROTOCOL', 'Every component has a role.']
        : frame.scene >= 8 ? ['LET’S BUILD', 'SOMETHING', 'MEANINGFUL.']
        : ['C++ / Java / Python', 'React / Node.js', 'Always learning.']
      lines.forEach((line, index) => fittedText(ctx, line, 68, 340 + index * 116, index < 2 ? 76 : 37, 865, index < 2 ? '#e8f9fb' : '#70a8ba'))
      ctx.strokeStyle = '#33cbdc'
      ctx.lineWidth = 3
      ctx.strokeRect(68, 762, 888, 100)
      ctx.font = '23px monospace'
      ctx.fillStyle = '#71d7e3'
      ctx.fillText('IDEAS → SYSTEMS → EXPERIENCES', 104, 823)
      ctx.font = '18px monospace'
      ctx.fillStyle = '#72919d'
      ctx.fillText('Scroll-controlled / Original laptop / Portfolio display', 68, 944)
    }
    texture.needsUpdate = true
    onPresent({ projectId: projectScene ? project.id : '', status })
  }

  return {
    texture,
    draw,
    activate() { alive = true; key = ''; onInvalidate() },
    dispose() { alive = false; texture.dispose() },
  }
}
