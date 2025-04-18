// src/components/call/CallButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { initiateCall } from "../../services/callService";

export default function CallButton({ conversationId }) {
    const nav = useNavigate();
    const start = async () => {
        const { call } = await initiateCall({ conversationId });
        // pass initiatorId into CallPage via location state
        nav(`/call/${call.id}`, { state: { initiatorId: call.initiatorId } });
    };
    return (
        <button onClick={start} style={{ padding: "6px 12px", cursor: "pointer" }}>
            Start Call
        </button>
    );
}
