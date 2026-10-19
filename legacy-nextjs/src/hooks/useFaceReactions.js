// Custom Hook: useFaceReactions
// Maps user actions inside demos to face expressions

import { useEffect } from 'react'
import { useFaceStore } from '@/store/useFaceStore'
import { usePortalStore } from '@/store/usePortalStore'
import { getProjectById } from '@/data/projects'

export const useFaceReactions = () => {
  const triggerReaction = useFaceStore(state => state.triggerReaction)
  const setExpression = useFaceStore(state => state.setExpression)
  const currentDemo = usePortalStore(state => state.currentDemo)
  const lastInteraction = usePortalStore(state => state.lastInteraction)
  const isOpen = usePortalStore(state => state.isOpen)

  // React when portal opens
  useEffect(() => {
    if (isOpen && currentDemo) {
      const project = getProjectById(currentDemo)
      if (project?.faceReactions?.onOpen) {
        setExpression(project.faceReactions.onOpen)
        triggerReaction(`open-${currentDemo}`, 2000)
      }
    }
  }, [isOpen, currentDemo, setExpression, triggerReaction])

  // React to interactions inside the demo
  useEffect(() => {
    if (!lastInteraction || !currentDemo) return

    const project = getProjectById(currentDemo)
    if (!project?.faceReactions) return

    const reactionKey = `on${lastInteraction.charAt(0).toUpperCase()}${lastInteraction.slice(1)}`
    const reaction = project.faceReactions[reactionKey]

    if (reaction) {
      setExpression(reaction)
      triggerReaction(`${currentDemo}-${lastInteraction}`, 2000)
    }
  }, [lastInteraction, currentDemo, setExpression, triggerReaction])

  // Helper function to manually trigger a reaction
  const reactTo = (action) => {
    if (!currentDemo) return
    
    const project = getProjectById(currentDemo)
    if (!project?.faceReactions) return

    const reactionKey = `on${action.charAt(0).toUpperCase()}${action.slice(1)}`
    const reaction = project.faceReactions[reactionKey]

    if (reaction) {
      setExpression(reaction)
      triggerReaction(`${currentDemo}-${action}`, 2000)
    }
  }

  return { reactTo }
}