import ChatMessage from "./ChatMessage"

function ChatCard({
    messages,
    message,
    setMessage,
    handleSend,
    handleKeyDown,
    handleLogout,
    isLoading,
}) {
    return (
        <div className="app">

            <header>
                <div className="pulse"></div>

                <div>
                    <h1>MindHealth</h1>

                    <p>
                        A safe space to talk — nothing you say here is judged.
                    </p>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <ChatMessage
                        key={msg.id}
                        text={msg.text}
                        sender={msg.sender}
                        time={msg.time}
                    />
                ))}

                {isLoading && (
                    <div className="row bot-row">
                        <div className="typing">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="checkin">
                <p>
                    If it helps, how's today sitting with you?
                </p>

                <div className="chips">
                    <button
                        className="chip"
                        onClick={() => setMessage("Heavy")}
                    >
                        Heavy
                    </button>

                    <button
                        className="chip"
                        onClick={() => setMessage("Anxious")}
                    >
                        Anxious
                    </button>

                    <button
                        className="chip"
                        onClick={() => setMessage("Okay, I guess")}
                    >
                        Okay, I guess
                    </button>

                    <button
                        className="chip"
                        onClick={() => setMessage("Steady")}
                    >
                        Steady
                    </button>
                </div>
            </div>

            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Tell me how you're feeling..."
                    autoComplete="off"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />

                <button
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                >
                    Send
                </button>
            </div>

            <p className="foot-note">
                MindHealth offers support, not a diagnosis or emergency care.
            </p>

        </div>
    )
}

export default ChatCard