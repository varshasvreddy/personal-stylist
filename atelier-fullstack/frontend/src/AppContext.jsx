import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from './api'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [meta, setMeta] = useState(null)
  const [metaError, setMetaError] = useState('')
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(!!getToken())
  const [garments, setGarments] = useState([])
  const [closetReady, setClosetReady] = useState(false)
  const [styleSession, setStyleSession] = useState(null) // the last brief and looks, kept while you move between tabs

  useEffect(() => {
    api.get('/meta/').then(setMeta).catch((e) => setMetaError(e.message))
  }, [])

  const clear = useCallback(() => {
    setToken(null)
    setUser(null)
    setGarments([])
    setClosetReady(false)
    setStyleSession(null)
  }, [])

  useEffect(() => {
    if (!getToken()) return
    api.get('/auth/me/').then(setUser).catch(() => clear()).finally(() => setBooting(false))
  }, [clear])

  useEffect(() => {
    window.addEventListener('atelier:unauthorized', clear)
    return () => window.removeEventListener('atelier:unauthorized', clear)
  }, [clear])

  useEffect(() => {
    if (!user) return
    api.get('/garments/').then((g) => { setGarments(g); setClosetReady(true) }).catch(() => setClosetReady(true))
  }, [user?.email]) // eslint-disable-line react-hooks/exhaustive-deps

  const enter = useCallback((payload) => {
    setToken(payload.token)
    setUser(payload.user)
  }, [])

  const value = useMemo(() => {
    const colors = meta ? Object.fromEntries(meta.colors.map((c) => [c.name, c])) : {}
    const categories = meta ? Object.fromEntries(meta.categories.map((c) => [c.key, c])) : {}
    return {
      meta, metaError, colors, categories, user, booting, garments, closetReady, styleSession, setStyleSession,
      login: async (email, password) => enter(await api.post('/auth/login/', { email, password })),
      register: async (name, email, password) => enter(await api.post('/auth/register/', { name, email, password })),
      logout: async () => { try { await api.post('/auth/logout/') } catch { /* already signed out */ } clear() },
      saveProfile: async (patch) => { const u = await api.patch('/auth/me/', patch); setUser(u); return u },
      addGarment: async (form) => {
        const g = await api.postForm('/garments/', form)
        setGarments((list) => [...list, g])
        return g
      },
      removeGarment: async (id) => {
        await api.del(`/garments/${id}/`)
        setGarments((list) => list.filter((g) => g.id !== id))
      },
    }
  }, [meta, metaError, user, booting, garments, closetReady, styleSession, enter, clear])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
