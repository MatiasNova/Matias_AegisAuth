import { useState, useEffect, useCallback } from "react";
import client from "../api/client";

export function useStats(interval = 1000) {
    const [overview, setOverview] = useState(null);
    const [recent, setRecent] = useState([]);
    const [trend, setTrend] = useState([]);
    // Fixed typo from isLoadinng to isLoading
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null);

    const fetch = useCallback(async () => {
        try {
            const [ov, re, tr] = await Promise.all([
                client.get("/stats/overview"),
                client.get("/stats/recent"),
                client.get("/stats/risk_trend"),
            ]);

            setOverview(ov.data);
            setRecent(re.data);
            setTrend(tr.data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            // Fixed typo from setLoading to setIsLoading
            setIsLoading(false); 
        }
    }, []); // Fixed invalid dependency array syntax from [[]] to []

    useEffect(() => {
        fetch();
        const id = setInterval(fetch, interval);
        return () => clearInterval(id);
    }, [fetch, interval]);

    return { overview, recent, trend, isLoading, error, refetch: fetch };
}

