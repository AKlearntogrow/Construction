import { createContext, useContext, useState } from 'react'

// Create the context
const ThemeContext = createContext()

// Provider component - wraps the app
export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true)

  const toggleTheme = () => setDarkMode(!darkMode)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook - use this in components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}