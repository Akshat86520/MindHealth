import { useState } from "react"
import "./Login.css"

function Login({ onLoginSuccess }) {
    const [mode, setMode] = useState("login")

    const [loginEmail, setLoginEmail] = useState("")
    const [loginPassword, setLoginPassword] = useState("")

    const [signupName, setSignupName] = useState("")
    const [signupEmail, setSignupEmail] = useState("")
    const [signupPassword, setSignupPassword] = useState("")
    const [signupConfirm, setSignupConfirm] = useState("")

    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function handleLogin(event) {
        event.preventDefault()
        setMessage("")
        setIsLoading(true)

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                }),
            })

            const data = await response.text()

            if (!response.ok) {
                setMessage(data)
                return
            }

            setMessage(data)

            if (onLoginSuccess) {
                onLoginSuccess()
            }
        } catch (error) {
            console.error("Login error:", error)
            setMessage("Unable to connect to the server.")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSignup(event) {
        event.preventDefault()
        setMessage("")

        if (signupPassword !== signupConfirm) {
            setMessage("Passwords do not match.")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: signupName,
                    email: signupEmail,
                    password: signupPassword,
                    confirm: signupConfirm,
                }),
            })

            const data = await response.text()

            if (!response.ok) {
                setMessage(data)
                return
            }

            setMessage(data)

            setMode("login")
            setLoginEmail(signupEmail)

            setSignupName("")
            setSignupEmail("")
            setSignupPassword("")
            setSignupConfirm("")
        } catch (error) {
            console.error("Signup error:", error)
            setMessage("Unable to connect to the server.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-page">

            <div className="pixel-stripe"></div>

            <div className="page-wrap">

                <div className="authCard">

                    {/* Header */}
                    <div className="card-header">

                        <svg
                            className="mascot"
                            viewBox="0 0 7 7"
                            shapeRendering="crispEdges"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect x="1" y="0" width="1" height="1" fill="#e5484d" />
                            <rect x="2" y="0" width="1" height="1" fill="#e5484d" />
                            <rect x="4" y="0" width="1" height="1" fill="#e5484d" />
                            <rect x="5" y="0" width="1" height="1" fill="#e5484d" />

                            <rect x="0" y="1" width="7" height="1" fill="#e5484d" />
                            <rect x="0" y="2" width="7" height="1" fill="#e5484d" />
                            <rect x="0" y="3" width="7" height="1" fill="#e5484d" />

                            <rect x="1" y="4" width="5" height="1" fill="#e5484d" />
                            <rect x="2" y="5" width="3" height="1" fill="#e5484d" />
                            <rect x="3" y="6" width="1" height="1" fill="#e5484d" />
                        </svg>

                        <div className="brand-text">
                            <h1>MINDHEALTH</h1>
                            <span className="badge">SAVE POINT</span>
                        </div>

                    </div>

                    {/* Tabs */}
                    <div className="tabs">

                        <button
                            type="button"
                            className={`tab ${mode === "login" ? "active" : ""}`}
                            onClick={() => {
                                setMode("login")
                                setMessage("")
                            }}
                        >
                            LOG IN
                        </button>

                        <button
                            type="button"
                            className={`tab ${mode === "signup" ? "active" : ""}`}
                            onClick={() => {
                                setMode("signup")
                                setMessage("")
                            }}
                        >
                            SIGN UP
                        </button>

                    </div>

                    {/* LOGIN */}
                    {mode === "login" && (
                        <div className="panel">

                            <form onSubmit={handleLogin}>

                                <div className="field">

                                    <label htmlFor="loginEmail">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        id="loginEmail"
                                        autoComplete="email"
                                        value={loginEmail}
                                        onChange={(event) =>
                                            setLoginEmail(event.target.value)
                                        }
                                        required
                                    />

                                </div>

                                <div className="field">

                                    <label htmlFor="loginPassword">
                                        Password
                                    </label>

                                    <input
                                        type="password"
                                        id="loginPassword"
                                        autoComplete="current-password"
                                        value={loginPassword}
                                        onChange={(event) =>
                                            setLoginPassword(event.target.value)
                                        }
                                        required
                                    />

                                </div>

                                <div className="row-between">

                                    <label className="checkbox-row">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                        />
                                        Remember me
                                    </label>

                                    <a href="#forgot">
                                        Forgot?
                                    </a>

                                </div>

                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? "LOADING..."
                                        : "PRESS START ▸"}
                                </button>

                            </form>

                            <p className="switch-text">
                                New here?{" "}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("signup")
                                        setMessage("")
                                    }}
                                >
                                    Create an account
                                </button>
                            </p>

                        </div>
                    )}

                    {/* SIGNUP */}
                    {mode === "signup" && (
                        <div className="panel">

                            <form onSubmit={handleSignup}>

                                <div className="field">

                                    <label htmlFor="signupName">
                                        Name
                                    </label>

                                    <input
                                        type="text"
                                        id="signupName"
                                        autoComplete="name"
                                        value={signupName}
                                        onChange={(event) =>
                                            setSignupName(event.target.value)
                                        }
                                        required
                                    />

                                </div>

                                <div className="field">

                                    <label htmlFor="signupEmail">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        id="signupEmail"
                                        autoComplete="email"
                                        value={signupEmail}
                                        onChange={(event) =>
                                            setSignupEmail(event.target.value)
                                        }
                                        required
                                    />

                                </div>

                                <div className="field">

                                    <label htmlFor="signupPassword">
                                        Password
                                    </label>

                                    <input
                                        type="password"
                                        id="signupPassword"
                                        autoComplete="new-password"
                                        value={signupPassword}
                                        onChange={(event) =>
                                            setSignupPassword(event.target.value)
                                        }
                                        required
                                    />

                                </div>

                                <div className="field">

                                    <label htmlFor="signupConfirm">
                                        Confirm password
                                    </label>

                                    <input
                                        type="password"
                                        id="signupConfirm"
                                        autoComplete="new-password"
                                        value={signupConfirm}
                                        onChange={(event) =>
                                            setSignupConfirm(event.target.value)
                                        }
                                        required
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? "LOADING..."
                                        : "NEW GAME ▸"}
                                </button>

                            </form>

                            <p className="switch-text">
                                Already have an account?{" "}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("login")
                                        setMessage("")
                                    }}
                                >
                                    Log in
                                </button>
                            </p>

                        </div>
                    )}

                    {/* MESSAGE */}
                    {message && (
                        <p className="auth-message">
                            {message}
                        </p>
                    )}

                    {/* FOOTER */}
                    <p className="foot-note">
                        MindHealth offers support, not a diagnosis or emergency care.
                    </p>

                </div>

            </div>

        </div>
    )
}

export default Login