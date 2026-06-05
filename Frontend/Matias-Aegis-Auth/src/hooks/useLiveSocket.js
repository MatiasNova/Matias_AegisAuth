import { useState, useEffect} from "react";

export function useLiveSocket(){
    const[liveData, setLiveData] = useState(null);
    const[connected, setConnected] = useState(false);

    useEffect(() =>{
        const ws = new WebSocket("ws://127.0.0.1:8000/ws/live");

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onerror =() => setConnected(false);

        ws.onmessage = (event) =>{
            try{
                const data = JSON.parse(event.data);
                if (data.type === "live_update") setLiveData(data);
            
            } catch {
                //
            }
        };
        return () => ws.close();

    }, []);
    return { liveData, connected };

}