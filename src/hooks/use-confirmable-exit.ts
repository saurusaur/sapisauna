import { useCallback, useState } from 'react'

interface ConfirmableExitOptions {
  shouldConfirm: boolean
  onExit: () => void
}

export function useConfirmableExit({ shouldConfirm, onExit }: ConfirmableExitOptions) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const requestExit = useCallback(() => {
    if (shouldConfirm) {
      setConfirmOpen(true)
      return
    }
    onExit()
  }, [shouldConfirm, onExit])

  const confirmExit = useCallback(() => {
    setConfirmOpen(false)
    onExit()
  }, [onExit])

  const cancelExit = useCallback(() => {
    setConfirmOpen(false)
  }, [])

  return {
    confirmOpen,
    requestExit,
    confirmExit,
    cancelExit,
  }
}
