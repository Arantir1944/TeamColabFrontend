// src/pages/CallPage.jsx
import React, { useEffect, useRef, useContext, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { joinCall, leaveCall, endCall } from "../services/callService";
import socket from "../utils/socket";
import {
    Box,
    Grid,
    Paper,
    Button,
    Typography
} from "@mui/material";
import CallEndIcon from "@mui/icons-material/CallEnd";

export default function CallPage() {
    const { callId } = useParams();
    const { user } = useContext(AuthContext);
    const { state } = useLocation();
    const initiatorId = state?.initiatorId;
    const navigate = useNavigate();

    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const pcRef = useRef(null);

    const cleanup = useCallback(async () => {
        try {
            await leaveCall(callId);
        } catch (err) {
            console.error("Leave failed:", err?.response?.data || err.message);
        }
        const pc = pcRef.current;
        if (pc) {
            pc.getSenders().forEach(s => s.track?.stop());
            pc.close();
        }
        socket.off("offer");
        socket.off("answer");
        socket.off("ice-candidate");
        socket.off("callEnded");
    }, [callId]);

    useEffect(() => {
        let mounted = true;
        async function start() {
            try {
                await joinCall(callId);
            } catch (err) {
                console.error("Join failed:", err?.response?.data || err.message);
            }

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });
            pcRef.current = pc;

            const localStream = await navigator.mediaDevices.getUserMedia({
                video: true, audio: true
            });
            if (!mounted) {
                localStream.getTracks().forEach(t => t.stop());
                return;
            }
            localRef.current.srcObject = localStream;
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

            pc.ontrack = e => { remoteRef.current.srcObject = e.streams[0]; };
            pc.onicecandidate = ({ candidate }) => {
                if (candidate) socket.emit("ice-candidate", { callId, candidate });
            };

            socket.on("offer", async ({ sdp }) => {
                await pc.setRemoteDescription(sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("answer", { callId, sdp: answer });
            });
            socket.on("answer", async ({ sdp }) => await pc.setRemoteDescription(sdp));
            socket.on("ice-candidate", async ({ candidate }) => await pc.addIceCandidate(candidate));

            if (user.id === initiatorId) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("offer", { callId, sdp: offer });
            }

            socket.on("callEnded", () => {
                cleanup();
                navigate("/chat", { replace: true });
            });
        }

        start();
        return () => {
            mounted = false;
            cleanup();
        };
    }, [callId, initiatorId, user.id, navigate, cleanup]);

    const handleHangUp = async () => {
        try { await endCall(callId); } catch { }
        cleanup();
        navigate("/chat", { replace: true });
    };

    return (
        <Box p={2}>
            <Typography variant="h5" align="center" gutterBottom>
                Video Call
            </Typography>
            <Grid container spacing={2} justifyContent="center">
                <Grid item>
                    <Paper elevation={3}>
                        <video
                            ref={localRef}
                            autoPlay muted
                            style={{ width: 200, height: 150, backgroundColor: "#000" }}
                        />
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper elevation={3}>
                        <video
                            ref={remoteRef}
                            autoPlay
                            style={{ width: 400, height: 300, backgroundColor: "#000" }}
                        />
                    </Paper>
                </Grid>
            </Grid>
            <Box textAlign="center" mt={2}>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<CallEndIcon />}
                    onClick={handleHangUp}
                >
                    Hang Up
                </Button>
            </Box>
        </Box>
    );
}
