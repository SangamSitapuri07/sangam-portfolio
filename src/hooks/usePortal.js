// Custom Hook: usePortal
// Manages portal interactions for project demos

import { usePortalStore } from '@/store/usePortalStore'
import { getProjectById } from '@/data/projects'

export const usePortal = () => {
  const openPortal = usePortalStore(state => state.openPortal)
  const closePortal = usePortalStore(state => state.closePortal)
  const recordInteraction = usePortalStore(state => state.recordInteraction)
  const isOpen = usePortalStore(state => state.isOpen)
  const currentDemo = usePortalStore(state => state.currentDemo)
  const showCTA = usePortalStore(state => state.showCTA)
  const hideCTA = usePortalStore(state => state.hideCTA)

  // Open a project demo
  const openDemo = (projectId, position = [0, 0, 0]) => {
    const project = getProjectById(projectId)
    if (!project) {
      console.warn(`Project "${projectId}" not found`)
      return
    }

    openPortal(projectId, project.demo.type, position)
  }

  // Close current demo
  const closeDemo = () => {
    closePortal()
  }

  // Record an interaction (for face reactions)
  const interact = (action) => {
    recordInteraction(action)
  }

  // Get current project info
  const getCurrentProject = () => {
    if (!currentDemo) return null
    return getProjectById(currentDemo)
  }

  return {
    openDemo,
    closeDemo,
    interact,
    isOpen,
    currentDemo,
    currentProject: getCurrentProject(),
    showCTA,
    hideCTA,
  }
}