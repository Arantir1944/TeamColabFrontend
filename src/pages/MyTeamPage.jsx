import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../services/authService";

export default function MyTeamPage() {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        axios.get("https://16.170.210.30:5001/api/teams/user", {
            headers: { Authorization: getToken() }
        })
            .then(res => setTeam(res.data.team))
            .catch(() => setError("Could not load your team."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!team) return <p>You are not in a team yet.</p>;

    return (
        <div style={{ padding: "2rem" }}>
            <h2>My Team</h2>
            <p><strong>ID:</strong> {team.id}</p>
            <p><strong>Name:</strong> {team.name}</p>

            {team.Users && (
                <>
                    <h3>Team Members:</h3>
                    <ul>
                        {team.Users.map(user => (
                            <li key={user.id}>
                                {user.firstName} {user.lastName} ({user.email})
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
