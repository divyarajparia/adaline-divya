import React from 'react'
import { AppProvider } from './context'
import Board from './components/Board'
import './index.css'
import Header from './components/Header'

//App.tsx – highest-level component for the client.
//It wraps the entire UI in <AppProvider> so every descendant can access context state.
function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <Header />
        <Board />
    </div>
    </AppProvider>
  )
}

export default App
