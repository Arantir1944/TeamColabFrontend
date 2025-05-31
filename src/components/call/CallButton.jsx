import React from "react";
import { Button } from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import { useNavigate } from "react-router-dom";
import { initiateCall } from "../../services/callService";

export default function CallButton({ conversationId }) {
    const nav = useNavigate();

    const start = async () => {
        try {
            // Try to create a new call
            const { call } = await initiateCall({ conversationId });
            // If successful, navigate into that call as the initiator
            nav(`/call/${call.id}`, { state: { initiatorId: call.initiatorId } });
        } catch (err) {
            // If the server responded 400 with a callId, join the existing call instead
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
