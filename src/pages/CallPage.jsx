// src/pages/CallPage.jsx

import React, { useEffect, useRef, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { joinCall, leaveCall, endCall } from "../services/callService";
import socket from "../utils/socket";
import {
    Box,
    Grid,
    Paper,
    Button,
    Typography,
} from "@mui/material";
import CallEndIcon from "@mui/icons-material/CallEnd";

export default function CallPage() {
    // ─── 1. Grab callId from URL (must match <Route path="/call/:callId" />) ────────────────
    const { callId } = useParams(); // e.g. "/call/123" → callId === "123"
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    // initiatorId is passed via ChatPage when user clicked “OK” on the confirm:
    const initiatorId = location.state?.initiatorId;

    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const pcRef = useRef(null);

    // ─── 2. Cleanup on unmount: close RTCPeerConnection, stop tracks, remove socket listeners ──
    useEffect(() => {
        return () => {
            if (pcRef.current) {
                pcRef.current.getSenders().forEach((sender) => sender.track?.stop());
                pcRef.current.close();
            }
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("callEnded");
        };
    }, [callId]);

    // ─── 3. Handle WebRTC offer/answer + ICE + joinCall logic ───────────────────────────────
    useEffect(() => {
        let isMounted = true;

        async function startPeerConnection() {
            // A) Create the RTCPeerConnection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    // Add any TURN servers here if you have them
                ],
            });
            pcRef.current = pc;

            // B) Grab local media (camera & mic) and add to peer connection
            let localStream;
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
            } catch (err) {
                console.error("Error obtaining user media:", err);
                return;
            }
            if (!isMounted) {
                localStream.getTracks().forEach((t) => t.stop());
                return;
            }
            localRef.current.srcObject = localStream;
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });

            // C) When a remote track arrives, display it in remote <video>
            pc.ontrack = (event) => {
                remoteRef.current.srcObject = event.streams[0];
            };

            // D) When an ICE candidate is found, send it over socket
            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    socket.emit("ice-candidate", { callId, candidate });
                }
            };

            // E) Listener: “offer” from initiator (only answerers handle this)
            socket.on("offer", async ({ sdp, fromUserId }) => {
                // Only proceed if fromUserId === initiatorId and I am not the initiator
                if (fromUserId === initiatorId && user.id !== initiatorId) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit("answer", {
                            callId,
                            sdp: answer,
                            toUserId: initiatorId,
                        });
                    } catch (err) {
                        console.error("Error handling offer:", err);
                    }
                }
            });

            // F) Listener: “answer” from an answerer (only initiator handles this)
            socket.on("answer", async ({ sdp, fromUserId }) => {
                if (user.id === initiatorId && fromUserId !== initiatorId) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    } catch (err) {
                        console.error("Error handling answer:", err);
                    }
                }
            });

            // G) Listener: “ice-candidate” from the other peer
            socket.on("ice-candidate", async ({ candidate, fromUserId }) => {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err);
                }
            });

            // H) Decide: Am I the initiator (offerer) or answerer (joiner)?
            if (user.id === initiatorId) {
                // — I started the call, so I create the offer immediately
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    // Emit offer to everyone in the "call-<callId>" room
                    socket.emit("offer", { callId, sdp: offer, toUserId: null });
                    // Also join the call room myself, so that I get ICE candidates back
                    socket.emit("joinCallRoom", { callId });
                } catch (err) {
                    console.error("Error creating/sending offer:", err);
                }
            } else {
                // — I am joining, so I must POST /join on the server
                try {
                    await joinCall(callId);
                } catch (err) {
                    // If 400 “already joined,” swallow and continue
                    if (
                        err.response?.status === 400 &&
                        err.response.data?.message === "You have already joined this call"
                    ) {
                        // OK, I’m already a participant; proceed
                    } else {
                        console.error("joinCall failed:", err);
                        return;
                    }
                }
                // Once I’ve joined on the server, I also join the "call-<callId>" room
                socket.emit("joinCallRoom", { callId });
                // Then wait for “offer” event (handled above)
            }
        }

        startPeerConnection();

        return () => {
            isMounted = false;
        };
    }, [callId, user.id, initiatorId]);

    // ─── 4. Listen for "callEnded" → navigate back to /chat ────────────────────────────────
    useEffect(() => {
        const onCallEnded = ({ callId: endedId }) => {
            if (endedId === parseInt(callId, 10)) {
                navigate("/chat");
            }
        };
        socket.on("callEnded", onCallEnded);
        return () => {
            socket.off("callEnded", onCallEnded);
        };
    }, [callId, navigate]);

    // ─── 5. Hang‐up / Leave / End logic ──────────────────────────────────────────────────────
    const handleHangUp = async () => {
        try {
            if (user.id === initiatorId) {
                // Only initiator calls endCall
                await endCall(callId);
            } else {
                // Non-initiator calls leaveCall
                await leaveCall(callId);
            }
        } catch (err) {
            console.error("Leave/End call failed:", err);
        }
        navigate("/chat");
    };

    return (
        <Box p={2} height="100vh">
            <Typography variant="h5" gutterBottom>
                Call Room: {callId}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Paper elevation={3}>
                        <video
                            ref={localRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ width: "100%" }}
                        />
                        <Typography align="center">Your Video</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Paper elevation={3}>
                        <video
                            ref={remoteRef}
                            autoPlay
                            playsInline
                            style={{ width: "100%" }}
                        />
                        <Typography align="center">Remote Video</Typography>
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
