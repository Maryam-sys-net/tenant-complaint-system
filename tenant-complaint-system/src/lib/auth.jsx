import { createContext, useContext, useState } from 'react'
import { getSession, loginUnit, loginManagement, logout as apiLogout } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession())

  const value = {
    session,
    async signInUnit(unit, password) { setSession(await loginUnit(unit, password)) },
    async signInManagement(password) { setSession(await loginManagement(password)) },
    signOut() { apiLogout(); setSession(null) },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
