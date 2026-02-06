import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

function App() {
    const [isRunning, setIsRunning] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unlisten = listen<string>("server-log", (event) => {
            setLogs((prevLogs) => [...prevLogs, event.payload]);
        });

        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    async function toggleServer() {
        try {
            if (isRunning) {
                setStatusMsg("Stopping server...");
                const response = await invoke<string>("stop_server");
                setStatusMsg(response);
                setIsRunning(false);
            } else {
                setStatusMsg("Launching server...");
                // Clear logs on clean launch? Maybe keep them. Let's keep them for now.
                // setLogs([]);
                const response = await invoke<string>("launch_server");
                setStatusMsg(response);
                setIsRunning(true);
            }
        } catch (error) {
            console.error(error);
            setStatusMsg(`Error: ${error}`);
            // If launch failed, verify state. Assume stopped if launch failed.
            if (!isRunning) setIsRunning(false);
        }
    }

    return (
        <main className="container">
            <div className="left-column">
                <h1>SPX Launcher</h1>
                <div className="status-section">
                    <p className="status-text">
                        {statusMsg || "Ready to launch"}
                    </p>
                </div>
                <div className="log-container">
                    {logs.map((log, index) => (
                        <div key={index} className="log-entry">
                            {log}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            <div className="right-column">
                <div className="launch-controls">
                    <button
                        className={`launch-btn ${isRunning ? "stop" : "launch"}`}
                        onClick={toggleServer}
                    >
                        {isRunning ? "STOP" : "LAUNCH"}
                    </button>
                </div>

                <div className="secondary-controls">
                    <button className="outline-btn">Logs...</button>
                    <button className="outline-btn">Help...</button>
                    <button className="outline-btn">Support...</button>
                </div>
            </div>
        </main>
    );
}

export default App;
