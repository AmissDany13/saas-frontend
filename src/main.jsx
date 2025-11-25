import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

const Login = lazy(() => import('./pages/Login.jsx'))
const Callback = lazy(() => import('./pages/Callback.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Project = lazy(() => import('./pages/Project.jsx'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<p style={{padding:16}}>Cargando…</p>}>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="project/:id" element={<ProtectedRoute><Project /></ProtectedRoute>} />
              <Route path="login" element={<Login />} />
              <Route path="callback" element={<Callback />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)