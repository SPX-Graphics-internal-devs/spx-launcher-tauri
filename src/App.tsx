import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
    const [isRunning, setIsRunning] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [uptime, setUptime] = useState(0);

    // Mock version and license for now
    //TODO: Get the correct app version from API?
    const appVersion = "SPX Broadcast v.1.0.2";
    //TODO: Get the correct license status from API?
    const licenseStatus = "Active";
    //TODO: Get the correct server address using current's machine IP
    const serverAddress = "http://localhost:5660";

    //TODO: Polishing app's styling
    //TODO: Get the correct uptime if needed

    // Uptime timer
    useEffect(() => {
        let interval: number | undefined;
        if (isRunning) {
            interval = setInterval(() => {
                setUptime((prev) => prev + 1);
            }, 1000);
        } else {
            setUptime(0);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
            .toString()
            .padStart(2, "0");
        const m = Math.floor((seconds % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    async function toggleServer() {
        try {
            if (isRunning) {
                setStatusMsg("Stopping server...");
                const response = await invoke<string>("stop_server");
                setStatusMsg(response);
                setIsRunning(false);
            } else {
                setStatusMsg("Launching server...");
                const response = await invoke<string>("launch_server");
                setStatusMsg(response);
                setIsRunning(true);
            }
        } catch (error) {
            console.error(error);
            setStatusMsg(`Error: ${error}`);
            if (!isRunning) setIsRunning(false);
        }
    }

    return (
        <main className="container">
            {/* Row 1: Header */}
            <div className="header-row">
                <div className="logo-section">
                    <img src="/logo.png" alt="Logo" className="app-logo" />
                </div>
                <div className="info-section">
                    <div className="info-item version">
                        Version: {appVersion}
                    </div>
                    <div
                        className={`info-item status ${isRunning ? "running" : "stopped"}`}
                    >
                        Status: {statusMsg}
                    </div>
                    {isRunning && (
                        <div className="info-item address">
                            Server: {serverAddress}
                        </div>
                    )}
                </div>
                <div className="launch-section">
                    <button
                        className={`launch-btn ${isRunning ? "stop" : "launch"}`}
                        onClick={toggleServer}
                    >
                        {isRunning ? "STOP" : "LAUNCH"}
                    </button>
                </div>
            </div>

            {/* Row 3: Footer */}
            <div className="footer-row">
                <div className="footer-info">
                    <div className="footer-text">
                        Uptime: {formatUptime(uptime)}
                    </div>
                    <div className="footer-text">License: {licenseStatus}</div>
                </div>
                <div className="footer-controls">
                    <button className="outline-btn">Logs...</button>
                    <button className="outline-btn">Help...</button>
                    <button className="outline-btn">Support...</button>
                </div>
            </div>
        </main>
    );
}

export default App;
