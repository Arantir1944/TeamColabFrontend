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
    const { id: callId } = useParams(); // callId from URL
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const initiatorId = location.state?.initiatorId; // either a number or undefined

    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const pcRef = useRef(null);

    // 1) Clean up on unmount (stop tracks, close RTCPeerConnection, remove socket listeners)
    useEffect(() => {
        return () => {
            if (pcRef.current) {
                pcRef.current.getSenders().forEach((s) => s.track?.stop());
                pcRef.current.close();
            }
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("callEnded");
        };
    }, [callId]);

    // 2) Main WebRTC + join/offer/answer flow
    useEffect(() => {
        let mounted = true;

        async function startPeerConnection() {
            // A) Create RTCPeerConnection with ICE servers
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    // Add TURN servers here if you have them
                ],
            });
            pcRef.current = pc;

            // B) Grab local media & add its tracks
            let localStream;
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
            } catch (err) {
                console.error("Error getting user media:", err);
                return;
            }
            if (!mounted) {
                localStream.getTracks().forEach((t) => t.stop());
                return;
            }
            localRef.current.srcObject = localStream;
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });

            // C) When remote track arrives → show it in remote <video>
            pc.ontrack = (event) => {
                remoteRef.current.srcObject = event.streams[0];
            };

            // D) ICE candidate event → emit via socket
            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    socket.emit("ice-candidate", { callId, candidate });
                }
            };

            // E) Listen for “offer” (only answerer should handle this)
            socket.on("offer", async ({ sdp, fromUserId }) => {
                if (fromUserId === initiatorId && user.id !== initiatorId) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        const ans = await pc.createAnswer();
                        await pc.setLocalDescription(ans);
                        socket.emit("answer", {
                            callId,
                            sdp: ans,
                            toUserId: initiatorId,
                        });
                    } catch (err) {
                        console.error("Error handling offer:", err);
                    }
                }
            });

            // F) Listen for “answer” (only initiator should handle this)
            socket.on("answer", async ({ sdp, fromUserId }) => {
                if (user.id === initiatorId && fromUserId !== initiatorId) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    } catch (err) {
                        console.error("Error handling answer:", err);
                    }
                }
            });

            // G) Listen for ICE candidates from other peer(s)
            socket.on("ice-candidate", async ({ candidate, fromUserId }) => {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err);
                }
            });

            // H) Now: decide if I’m initiator or answerer
            if (user.id === initiatorId) {
                // I am the caller (offerer)
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit("offer", {
                        callId,
                        sdp: offer,
                        toUserId: null, // server will broadcast to everyone except initiator
                    });
                } catch (err) {
                    console.error("Error creating or sending offer:", err);
                }
            } else {
                // I did not start the call, so I must JOIN on the server
                try {
                    await joinCall(callId);
                } catch (err) {
                    // If 400 “already joined,” swallow and continue
                    if (
                        err.response?.status === 400 &&
                        err.response.data?.message === "You have already joined this call"
                    ) {
                        // Already a participant; continue waiting for “offer”
                    } else {
                        console.error("joinCall failed:", err);
                        return;
                    }
                }
                // After joinCall, wait for “offer” (handled above)
            }
        }

        startPeerConnection();

        return () => {
            mounted = false;
        };
    }, [callId, user.id, initiatorId]);

    // 3) Hang Up / Leave / End logic
    const handleHangUp = async () => {
        try {
            if (user.id === initiatorId) {
                // If I’m the initiator, end the call for everyone
                await endCall(callId);
            } else {
                // If I’m a joiner/answerer, just leave
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
