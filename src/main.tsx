import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App'
import { initInstallCapture } from '@/services/install'
import './App.css'

// Before rendering: the browser can offer installation very early, and only once
initInstallCapture()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Offline support for the installed web app (not needed inside the Android/iOS shell)
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    // The build id in the URL makes every published build install a fresh worker and cache
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=${__BUILD_ID__}`).catch(() => {
      // Not fatal: the app simply works online only
    })
  })
}
