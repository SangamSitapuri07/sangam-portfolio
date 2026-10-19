// A stalled enhancement must never strand the visitor in a loader. These
// limits only select the complete reading layout; they do not fake progress.
export const ASSET_CHECK_TIMEOUT_MS = 8000
export const SCENE_READY_TIMEOUT_MS = 45000
