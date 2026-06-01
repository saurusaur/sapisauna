'use client'

import { useCallback, useEffect, useState } from 'react'

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'error'

export type GeoPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied'

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

let cachedLocation: UserLocation | null = null

function mapGeolocationError(error: GeolocationPositionError): LocationStatus {
  if (error.code === error.PERMISSION_DENIED) return 'denied'
  if (error.code === error.POSITION_UNAVAILABLE) return 'unavailable'
  if (error.code === error.TIMEOUT) return 'timeout'
  return 'error'
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(cachedLocation)
  const [status, setStatus] = useState<LocationStatus>(cachedLocation ? 'granted' : 'idle')
  const [permissionState, setPermissionState] = useState<GeoPermissionState>('unknown')

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) return

    let permissionStatus: PermissionStatus | null = null
    let cancelled = false

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        if (cancelled) return
        permissionStatus = result
        setPermissionState(result.state)
        if (result.state === 'denied') setStatus('denied')

        result.onchange = () => {
          setPermissionState(result.state)
          if (result.state === 'denied') setStatus('denied')
        }
      })
      .catch(() => {
        setPermissionState('unknown')
      })

    return () => {
      cancelled = true
      if (permissionStatus) permissionStatus.onchange = null
    }
  }, [])

  const requestLocation = useCallback(() => {
    // Keep this function behind user click handlers. iOS Safari can ignore
    // geolocation prompts that are triggered automatically from effects.
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable')
      return
    }

    if (permissionState === 'denied') {
      setStatus('denied')
      return
    }

    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }
        cachedLocation = nextLocation
        setLocation(nextLocation)
        setStatus('granted')
        setPermissionState('granted')
      },
      (error) => {
        const nextStatus = mapGeolocationError(error)
        setStatus(nextStatus)
        if (nextStatus === 'denied') setPermissionState('denied')
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 8000,
      }
    )
  }, [permissionState])

  const clearLocation = useCallback(() => {
    cachedLocation = null
    setLocation(null)
    setStatus('idle')
  }, [])

  return {
    location,
    status,
    permissionState,
    requestLocation,
    clearLocation,
  }
}
