import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth'
import { LangProvider } from './i18n/useLang'
import RequireAuth from './components/RequireAuth'
import AppShell from './components/AppShell'
import Landing from './features/landing/Landing'
import Login from './features/auth/Login'
import Profile from './features/auth/Profile'
import Dashboard from './features/dashboard/Dashboard'
import PracticeHome from './features/practice/PracticeHome'
import UniversityList from './features/universities/List'
import WordBank from './features/words/WordBank'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
              <Route index element={<Dashboard />} />
              <Route path="practice" element={<PracticeHome />} />
              <Route path="universities" element={<UniversityList />} />
              <Route path="words" element={<WordBank />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
