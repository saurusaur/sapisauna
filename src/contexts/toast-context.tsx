/**
 * Toast 전역 Context — error + undo 2가지 타입만
 * VIS 9-7 기준: BottomNav 위 (bottom: 80px), animate-intro-up
 */

'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ToastType = 'error' | 'undo'

interface Toast {
  id: string
  type: ToastType
  message: string
  onUndo?: () => void
  duration: number
}

interface ToastContextValue {
  toasts: Toast[]
  showError: (message: string) => void
  showUndo: (message: string, onUndo: () => void) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { ...toast, id }])

    // 자동 소멸
    setTimeout(() => dismiss(id), toast.duration)
  }, [dismiss])

  const showError = useCallback((message: string) => {
    addToast({ type: 'error', message, duration: 4000 })
  }, [addToast])

  const showUndo = useCallback((message: string, onUndo: () => void) => {
    addToast({ type: 'undo', message, onUndo, duration: 5000 })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, showError, showUndo, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
