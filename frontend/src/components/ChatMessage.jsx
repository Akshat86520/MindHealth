function ChatMessage({ text, sender, time }) {
    return (
        <div className={`row ${sender === "user" ? "user-row" : "bot-row"}`}>
            <div
                className={`message ${sender === "user" ? "user-message" : "bot-message"
                    }`}
            >
                {text}
            </div>

            <div className="msg-time">{time}</div>
        </div>
    )
}

export default ChatMessage