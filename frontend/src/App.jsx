import { useEffect, useState } from "react"
import Login from "./components/Login"
import ChatBox from "./components/ChatBox"
import "./App.css"

// ADD IT HERE — below imports, before function App()
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://mindhealth-vyjs.onrender.com";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/session`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Session request failed: ${response.status}`);
        }

        const data = await response.json()

        console.log("Session response:", data)

        setIsLoggedIn(data.loggedIn)
      } catch (error) {
        console.error("Session check error:", error)
        setIsLoggedIn(false)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  if (checkingSession) {
    return null
  }

  if (isLoggedIn) {
    return <ChatBox />
  }

  return (
    <Login
      onLoginSuccess={() => setIsLoggedIn(true)}
    />
  )
}

export default App