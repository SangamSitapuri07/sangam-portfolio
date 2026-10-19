import { chapterById } from '@/data/chapters'
import ChapterHeading from './ChapterHeading'
import StoryCaption from '@/components/StoryCaption'

/**
 * Scene 07 — The Reassembly Protocol.
 *
 * Nothing new is animated here: the exploded view from scene 03 is driven back
 * down its own curve, so the machine returns to exactly the transforms it started
 * with. The copy says so plainly, because that constraint is the point of the
 * scene.
 */
export default function Rebuild() {
  const chapter = chapterById.rebuild
  return (
    <div className="w-full space-y-6">
      <ChapterHeading chapter={chapter} id="rebuild-heading" />

      {/* The four parts the teardown did not narrate get their lines here, while
          the same four transforms play backwards. */}
      <StoryCaption sceneId="rebuild" />

      <ol className="max-w-md space-y-2 border-t border-line/70 pt-5 text-xs leading-relaxed text-ink-soft">
        <li className="flex gap-3">
          <span className="font-mono text-[0.6875rem] text-accent">01</span>
          <span>Every part is measured once, against the pose it was assembled in.</span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-[0.6875rem] text-accent">02</span>
          <span>The scroll value is the only input, so scrolling up replays the take frame for frame.</span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-[0.6875rem] text-accent">03</span>
          <span>At zero, the machine is bit-identical to the model that loaded.</span>
        </li>
      </ol>

      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
    </div>
  )
}
