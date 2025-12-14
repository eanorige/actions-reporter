import { ActionData } from './logParser'

const STORAGE_KEY = 'actions_reporter_data'

export const getStoredActions = (): ActionData[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export const storeActions = (newActions: ActionData[]) => {
  const currentActions = getStoredActions()

  // Create a map for deduplication based on ID if available, or fallback to a composite key
  const actionMap = new Map<string, ActionData>()

  // Helper to generate key
  const getKey = (action: ActionData) => {
    if (action.id) return `id:${action.id}`
    return `run:${action.name}:${action.branch}:${action.timestamp}`
  }

  // Load current actions into map
  currentActions.forEach((action) => {
    actionMap.set(getKey(action), action)
  })

  // Merge new actions
  newActions.forEach((action) => {
    actionMap.set(getKey(action), action)
  })

  const mergedActions = Array.from(actionMap.values())
  // Sort by timestamp descending
  mergedActions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedActions))
  return mergedActions
}

export const clearStoredActions = () => {
  localStorage.removeItem(STORAGE_KEY)
}
