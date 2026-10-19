import { chapterById } from '@/data/chapters'
import { units } from '@/lib/explodedView'
import ChapterHeading from './ChapterHeading'

/**
 * Scene 03 — The Breakdown Protocol.
 *
 * The signature shot: the machine comes apart as you scroll. The list beside it is
 * the same list the shader is animating — the model's own separable groups, by
 * name — so the copy cannot drift from the animation.
 */
const LABELS = {
  lid: 'Lid assembly',
  display: 'Display panes',
  keyboard: 'Keyboard layer',
  deck: 'Deck plate',
  bottom: 'Bottom shell',
  accent: 'Accent strip',
  hardware: 'Side hardware',
  details: 'Small details',
}

export default function Breakdown() {
  const chapter = chapterById.breakdown
  return (
    <div className="w-full space-y-6">
      <ChapterHeading chapter={chapter} id="breakdown-heading" />

      <ol className="max-w-md space-y-2.5 border-t border-line/70 pt-5">
        {units.map((unit, index) => (
          <li key={unit.id} className="flex items-baseline gap-3 text-sm">
            <span className="font-mono text-[0.6875rem] text-ink-faint tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-ink-soft">{LABELS[unit.id] || unit.id}</span>
          </li>
        ))}
      </ol>

      <p className="max-w-[44ch] border-l border-accent/40 pl-4 text-xs leading-relaxed text-ink-faint">
        {chapter.note}
      </p>

      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
    </div>
  )
}
