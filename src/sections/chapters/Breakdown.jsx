import { chapterById } from '@/data/chapters'
import ChapterHeading from './ChapterHeading'
import StoryCaption from '@/components/StoryCaption'

/**
 * Scene 03 — The Breakdown Protocol.
 *
 * The signature shot: the machine comes apart as you scroll, and stops on each
 * layer long enough to say what it is for. The four claims live in `config/parts.js`
 * and are rendered by `StoryCaption`, which reads the same focus weight the camera
 * and the component animation do — so the words cannot drift from the part.
 */

export default function Breakdown() {
  const chapter = chapterById.breakdown
  return (
    <div className="w-full space-y-6">
      <ChapterHeading chapter={chapter} id="breakdown-heading" />

      <StoryCaption sceneId="breakdown" />

      <p className="max-w-[44ch] border-l border-accent/40 pl-4 text-xs leading-relaxed text-ink-faint">
        {chapter.note}
      </p>

      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
    </div>
  )
}
