// src/components/chat/MessageList.jsx
import React, { useRef, useEffect } from "react";

export default function MessageList({ messages }) {
    const endRef = useRef();
    useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    return (
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            {messages.map(m => (
                <div key={m.id} style={{ margin: "4px 0" }}>
                    <strong>{m.sender.firstName}:</strong> {m.content}
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
}
