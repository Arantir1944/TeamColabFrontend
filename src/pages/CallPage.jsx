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
    const { callId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const initiatorId = location.state?.initiatorId;

    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const pcRef = useRef(null);

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

    useEffect(() => {
        let isMounted = true;
        const pendingCandidates = [];
        let remoteDescriptionSet = false;

        async function startPeerConnection() {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            pcRef.current = pc;

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

            pc.ontrack = (event) => {
                remoteRef.current.srcObject = event.streams[0];
            };

            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    socket.emit("ice-candidate", {
                        callId,
                        candidate,
                        fromUserId: user.id,
                    });
                }
            };

            socket.on("offer", async ({ sdp, fromUserId }) => {
                if (fromUserId === initiatorId && user.id !== initiatorId) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        remoteDescriptionSet = true;

                        while (pendingCandidates.length > 0) {
                            try {
                                await pc.addIceCandidate(pendingCandidates.shift());
                            } catch (err) {
                                console.error("Error adding buffered ICE candidate:", err);
                            }
                        }

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

            socket.on("answer", async ({ sdp, fromUserId }) => {
                if (user.id === initiatorId && fromUserId !== initiatorId) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        remoteDescriptionSet = true;

                        while (pendingCandidates.length > 0) {
                            try {
                                await pc.addIceCandidate(pendingCandidates.shift());
                            } catch (err) {
                                console.error("Error adding buffered ICE candidate:", err);
                            }
                        }
                    } catch (err) {
                        console.error("Error handling answer:", err);
                    }
                }
            });

            socket.on("ice-candidate", async ({ candidate, fromUserId }) => {
                if (!candidate) return;
                const iceCandidate = new RTCIceCandidate(candidate);

                if (pc.remoteDescription && pc.remoteDescription.type) {
                    try {
                        await pc.addIceCandidate(iceCandidate);
                    } catch (err) {
                        console.error("Error adding ICE candidate:", err);
                    }
                } else {
                    console.warn("Remote description not set. Buffering candidate...");
                    pendingCandidates.push(iceCandidate);
                }
            });

            if (user.id === initiatorId) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit("joinCallRoom", { callId });
                    socket.emit("offer", {
                        callId,
                        sdp: offer,
                        fromUserId: user.id,
                        toUserId: null,
                    });
                } catch (err) {
                    console.error("Error creating/sending offer:", err);
                }
            } else {
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
                socket.emit("joinCallRoom", { callId });
            }
        }

        startPeerConnection();

        return () => {
            isMounted = false;
        };
    }, [callId, user.id, initiatorId]);

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

    const handleHangUp = async () => {
        try {
            if (user.id === initiatorId) {
                await endCall(callId);
            } else {
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
