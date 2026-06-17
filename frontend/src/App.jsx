/**
 * App.jsx – Single entry point: renders <Demo /> wrapped in <DemoProvider>.
 * No routing, no login.
 */
import React from 'react'
import { DemoProvider } from './context/DemoContext'
import Demo from './pages/Demo'

function App() {
  return (
    <DemoProvider>
      <Demo />
    </DemoProvider>
  )
}

export default App
