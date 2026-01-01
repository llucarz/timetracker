import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import App from './App.tsx'
import { TimeTrackerProvider } from './context/TimeTrackerContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <TimeTrackerProvider>
          <App />
        </TimeTrackerProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
} catch (e) {
  console.error('Main: Crash', e);
}