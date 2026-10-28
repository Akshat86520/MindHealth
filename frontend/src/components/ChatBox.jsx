
import { useEffect, useState } from "react"
import ChatCard from "./ChatCard"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })
}

function ChatBox() {
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    // Load previous chat messages from the database
    useEffect(() => {
        async function loadChatHistory() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/chat-history`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                )

                if (!response.ok) {
                    throw new Error(
                        `Failed to load chat history: ${response.status}`
                    )
                }

                const data = await response.json()

                console.log("Chat history:", data)

                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages)
                } else {
                    setMessages([
                        {
                            id: "welcome",
                            text: "Hi, I'm MindHealth. How are you feeling today?",
                            sender: "bot",
                            time: getCurrentTime(),
                        },
                    ])
                }
            } catch (error) {
                console.error("Chat history error:", error)

                setMessages([
                    {
                        id: "welcome",
                        text: "Hi, I'm MindHealth. How are you feeling today?",
                        sender: "bot",
                        time: getCurrentTime(),
                    },
                ])
            }
        }

        loadChatHistory()
    }, [])

    async function handleLogout() {
        try {
            const response = await fetch(`${API_BASE_URL}/logout`, {
                method: "GET",
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error(`Logout failed: ${response.status}`)
            }

            window.location.reload()
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    async function handleSend() {
        const text = message.trim()

        if (!text || isLoading) {
            return
        }

        const userMessage = {
            id: Date.now(),
            text,
            sender: "user",
            time: getCurrentTime(),
        }

        setMessages((previousMessages) => [
            ...previousMessages,
            userMessage,
        ])

        setMessage("")
        setIsLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    message: text,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(
                    `Chat request failed (${response.status}): ${errorText}`
                )
            }

            if (!response.body) {
                throw new Error("No response body received")
            }

            const botMessageId = Date.now() + 1

            setMessages((previousMessages) => [
                ...previousMessages,
                {
                    id: botMessageId,
                    text: "",
                    sender: "bot",
                    time: getCurrentTime(),
                },
            ])

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            let botText = ""

            while (true) {
                const { value, done } = await reader.read()

                if (done) {
                    botText += decoder.decode()
                    break
                }

                botText += decoder.decode(value, {
                    stream: true,
                })

                setMessages((previousMessages) =>
                    previousMessages.map((msg) =>
                        msg.id === botMessageId
                            ? {
                                ...msg,
                                text: botText,
                            }
                            : msg
                    )
                )
            }

            setMessages((previousMessages) =>
                previousMessages.map((msg) =>
                    msg.id === botMessageId
                        ? {
                            ...msg,
                            text: botText,
                        }
                        : msg
                )
            )
        } catch (error) {
            console.error("Chat error:", error)

            setMessages((previousMessages) => [
                ...previousMessages,
                {
                    id: Date.now() + 2,
                    text: "Something went wrong on my end. Please try again in a moment.",
                    sender: "bot",
                    time: getCurrentTime(),
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault()
            handleSend()
        }
    }

    return (
        <ChatCard
            messages={messages}
            message={message}
            setMessage={setMessage}
            handleSend={handleSend}
            handleKeyDown={handleKeyDown}
            handleLogout={handleLogout}
            isLoading={isLoading}
        />
    )
}

export default ChatBox
