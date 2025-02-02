import { useEffect } from "react";

export default function Debug() {
    useEffect(() => {
        console.log("✅ Debug Page Loaded");
    }, []);

    return (
        <div>
            <h1>Debug Page</h1>
            <p>If you see this, React Router is working correctly.</p>
        </div>
    );
}
