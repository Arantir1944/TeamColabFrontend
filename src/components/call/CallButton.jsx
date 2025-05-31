// src/components/call/CallButton.jsx
import React from "react";
import { Button } from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import { useNavigate } from "react-router-dom";
import { initiateCall } from "../../services/callService";

export default function CallButton({ conversationId }) {
    const nav = useNavigate();
    const start = async () => {
        try {
            const { call } = await initiateCall({ conversationId });
            nav(`/call/${call.id}`, { state: { initiatorId: call.initiatorId } });
        } catch (err) {
            if (err.response?.status === 400 && typeof err.response.data?.callId === 'number'
            ) {
                nav(`/call/${err.response.data.callId}`);
            } else {
                console.error("Unexpected error creating call:", err);
            }
        }
    };

    return (
        <Button
            variant="contained"
            color="primary"
            startIcon={<CallIcon />}
            onClick={start}
        >
            Call
        </Button>
    );
}
