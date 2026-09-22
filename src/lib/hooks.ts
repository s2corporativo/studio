'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useFetch<T>(url: string | null, deps: any[] = []): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)
  const reqId = useRef(0)

  const doFetch = useCallback(() => {
    if (!url) {
      setData(null)
      setLoading(false)
      return
    }
    const id = ++reqId.current
    setLoading(true)
    setError(null)
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => {
        if (id === reqId.current) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (id === reqId.current) {
          setError(e.message)
          setLoading(false)
        }
      })
  }, [url])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    doFetch()
  }, [doFetch, ...deps])

  return { data, loading, error, refresh: doFetch }
}

export async function apiPost<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${r.status}`)
  }
  return r.json()
}

export async function apiPut<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${r.status}`)
  }
  return r.json()
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const r = await fetch(url, { method: 'DELETE' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function apiPatch<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}
