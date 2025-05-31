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
    // ─── 1. Grab callId from URL (must match <Route path="/call/:callId" />) ──────────
    const { callId } = useParams(); // e.g. "/call/123" → callId === "123"
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    // initiatorId was passed via ChatPage: navigate(`/call/${callId}`, { state: { initiatorId } })
    const initiatorId = location.state?.initiatorId;

    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const pcRef = useRef(null);

    // ─── 2. Cleanup on unmount: close peer connection, stop tracks, remove socket listeners ──
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

    // ─── 3. Main WebRTC + joinCall + offer/answer/ICE flow ───────────────────────────────
    useEffect(() => {
        let isMounted = true;

        async function startPeerConnection() {
            // A) Create the RTCPeerConnection and ICE servers
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            pcRef.current = pc;

            // B) Get local media (camera & microphone)
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

            // Attach local tracks to <video> and to PC
            localRef.current.srcObject = localStream;
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });

            // C) When a remote track arrives, display it
            pc.ontrack = (event) => {
                remoteRef.current.srcObject = event.streams[0];
            };

            // D) When ICE candidate is found, send it to the other peer(s)
            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    socket.emit("ice-candidate", {
                        callId,
                        candidate,
                        fromUserId: user.id,
                    });
                }
            };

            // E) Listener: "offer" from initiator (answerer side)
            socket.on("offer", async ({ sdp, fromUserId }) => {
                if (fromUserId === initiatorId && user.id !== initiatorId) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit("answer", {
                            callId,
                            sdp: answer,
                            fromUserId: user.id,
                            toUserId: initiatorId,
                        });
                    } catch (err) {
                        console.error("Error handling offer:", err);
                    }
                }
            });

            // F) Listener: "answer" from answerer (initiator side)
            socket.on("answer", async ({ sdp, fromUserId }) => {
                if (user.id === initiatorId && fromUserId !== initiatorId) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    } catch (err) {
                        console.error("Error handling answer:", err);
                    }
                }
            });

            // G) Listener: "ice-candidate" from the other peer
            socket.on("ice-candidate", async ({ candidate, fromUserId }) => {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err);
                }
            });

            // H) Decide: Am I the initiator (offerer) or answerer (joiner)?
            if (user.id === initiatorId) {
                // ─ I am the caller → createOffer immediately
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    // 1) Join the call room on the socket so we receive ICE / callEnded
                    socket.emit("joinCallRoom", { callId });
                    // 2) Broadcast the offer into that room
                    socket.emit("offer", {
                        callId,
                        sdp: offer,
                        fromUserId: user.id,
                        toUserId: null, // server will broadcast to all in call-<callId>
                    });
                } catch (err) {
                    console.error("Error creating/sending offer:", err);
                }
            } else {
                // ─ I am a joiner → POST /join on server, then join socket room, then wait for "offer"
                try {
                    await joinCall(callId);
                } catch (err) {
                    if (
                        err.response?.status === 400 &&
                        err.response.data?.message === "You have already joined this call"
                    ) {
                        console.warn("Already joined; continuing");
                    } else {
                        console.error("joinCall failed:", err);
                        return;
                    }
                }
                // After joinCall succeeds (or if already joined), join the socket room:
                socket.emit("joinCallRoom", { callId });
                // Now wait for "offer" to arrive (handled above in step E)
            }
        }

        startPeerConnection();

        return () => {
            isMounted = false;
        };
    }, [callId, user.id, initiatorId]);

    // ─── 4. Listen for "callEnded" so we can auto-navigate back to /chat ─────────────────
    useEffect(() => {
        const onCallEnded = ({ callId: endedId }) => {
            if (parseInt(endedId, 10) === parseInt(callId, 10)) {
                navigate("/chat");
            }
        };
        socket.on("callEnded", onCallEnded);
        return () => {
            socket.off("callEnded", onCallEnded);
        };
    }, [callId, navigate]);

    // ─── 5. Hang‐up / Leave / End logic ────────────────────────────────────────────────────
    const handleHangUp = async () => {
        try {
            if (user.id === initiatorId) {
                // If I’m the initiator, end the call for everyone
                await endCall(callId);
            } else {
                // Otherwise, just leave the call as a joiner
                await leaveCall(callId);
            }
        } catch (err) {
            console.error("Leave/End call failed:", err);
        }
        // Immediately navigate back to /chat
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
