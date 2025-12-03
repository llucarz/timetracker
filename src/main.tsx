/**
 * Application Entry Point
 * 
 * Sets up:
 * - React root with StrictMode
 * - ErrorBoundary for crash recovery
 * - TimeTrackerProvider for global state
 * - Toaster for notifications (sonner)
 * 
 * Loads global styles from index.css
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TimeTrackerProvider } from './context/TimeTrackerContext.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TimeTrackerProvider>
        <App />
        <Toaster />
      </TimeTrackerProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)  