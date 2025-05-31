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
            // 1a. Attempt to create a brand-new call
            const { call } = await initiateCall({ conversationId });
            // 1b. Navigate into that call as the initiator:
            nav(`/call/${call.id}`, { state: { initiatorId: call.initiatorId } });
        } catch (err) {
            // 2a. If a 400 arrives with an existing callId, auto-join that
            if (
                err.response?.status === 400 &&
                typeof err.response.data?.callId === "number"
            ) {
                const existingCallId = err.response.data.callId;
                nav(`/call/${existingCallId}`);
            } else {
                console.error("Unexpected error initiating call:", err);
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
