import { useEffect, useState } from 'react'
import { ydoc, cardsMap } from './store'

function App() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Verify YJS is working
    console.log('YJS Doc ID:', ydoc.guid)
    console.log('Cards Map:', cardsMap)
    setInitialized(true)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>CRDT Cards</h1>
      <p>A collaborative card application powered by YJS</p>
      {initialized && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <p>✅ YJS initialized successfully</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            Document ID: {ydoc.guid}
          </p>
        </div>
      )}
    </div>
  )
}

export default App
