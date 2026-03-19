import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DisplayView from './components/DisplayView.jsx'

const pathParts = window.location.pathname.split('/')
const isDisplay = pathParts[1] === 'display' && pathParts[2]
const displayToken = isDisplay ? pathParts[2] : null

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {displayToken ? <DisplayView token={displayToken} /> : <App />}
  </StrictMode>,
)
