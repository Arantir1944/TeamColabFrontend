// src/pages/CallPage.jsx
import React, { useEffect, useRef, useContext, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";        // :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
import { joinCall, leaveCall, endCall } from "../services/callService";
import socket from "../utils/socket";

export default function CallPage() {
    const { callId } = useParams();
    const { user } = useContext(AuthContext);
    const { state } = useLocation();
    const initiatorId = state?.initiatorId;
    const navigate = useNavigate();

    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const pcRef = useRef(null);

    // Cleanup function
    const cleanup = useCallback(async () => {
        try {
            // Tell backend we’re leaving
            await leaveCall(callId);
        } catch (_) {
            // ignore errors
        }
        // Stop all media
        const pc = pcRef.current;
        if (pc) {
            pc.getSenders().forEach(sender => {
                if (sender.track) sender.track.stop();
            });
            pc.close();
        }
        // Remove all socket listeners for this call
        socket.off("offer");
        socket.off("answer");
        socket.off("ice-candidate");
        socket.off("callEnded");
    }, [callId]);

    useEffect(() => {
        let mounted = true;
        async function start() {
            // 1) Join the call record
            await joinCall(callId);

            // 2) Create peer connection
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });
            pcRef.current = pc;

            // 3) Get and attach local stream
            const localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            if (!mounted) {
                localStream.getTracks().forEach(t => t.stop());
                return;
            }
            localRef.current.srcObject = localStream;
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

            // 4) Remote tracks
            pc.ontrack = event => {
                remoteRef.current.srcObject = event.streams[0];
            };

            // 5) ICE candidates
            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    socket.emit("ice-candidate", { callId, candidate });
                }
            };

            // 6) Signaling listeners
            socket.on("offer", async ({ sdp }) => {
                await pc.setRemoteDescription(sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("answer", { callId, sdp: answer });
            });

            socket.on("answer", async ({ sdp }) => {
                await pc.setRemoteDescription(sdp);
            });

            socket.on("ice-candidate", async ({ candidate }) => {
                await pc.addIceCandidate(candidate);
            });

            // 7) Initiator creates the offer
            if (user.id === initiatorId) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("offer", { callId, sdp: offer });
            }

            // 8) Remote end call handling
            socket.on("callEnded", () => {
                cleanup();
                navigate("/chat", { replace: true });
            });
        }

        start();

        return () => {
            mounted = false;
            cleanup();
            // If user manually navigates away, don't try to hang up again
        };
    }, [callId, initiatorId, user.id, navigate, cleanup]);

    // Hang‑up button handler
    const handleHangUp = async () => {
        try {
            await endCall(callId);
        } catch (_) {
            // ignore
        }
        cleanup();
        navigate("/chat", { replace: true });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 16 }}>
            <div>
                <video
                    ref={localRef}
                    autoPlay
                    muted
                    style={{ width: 200, border: "1px solid #ccc", marginRight: 8 }}
                />
                <video
                    ref={remoteRef}
                    autoPlay
                    style={{ width: 400, border: "1px solid #ccc" }}
                />
            </div>
            <button
                onClick={handleHangUp}
                style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}
            >
                Hang Up
            </button>
        </div>
    );
}
