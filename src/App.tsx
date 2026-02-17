import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
    const [isRunning, setIsRunning] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [uptime, setUptime] = useState(0);
    const [port, setPort] = useState("5660");
    const [appVersion, setAppVersion] = useState("SPX Broadcast");
    const [license, setLicense] = useState("");
    const [hostID, setHostID] = useState("");
    // const logsEndRef = useRef<HTMLDivElement>(null);

    // Fetch port from backend (defaults to 5660, or uses CLI argument if provided)
    // When running the app, you can specify a different port like this:
    // npm run tauri dev -- -- 5660
    useEffect(() => {
        invoke<string>("get_port").then((p) => setPort(p));
    }, []);

    // Fetch app version from API when server is running (with retry)
    useEffect(() => {
        if (!isRunning) return;

        let cancelled = false;
        const maxAttempts = 10;
        const retryDelay = 1000; // 1 second between retries

        const fetchVersion = async (attempt: number) => {
            if (cancelled) return;
            try {
                const res = await fetch(`http://localhost:${port}/api/v1/version`);
                const data = await res.json();
                console.log(data);
                if (cancelled) return;

                if (data.version) {
                    setAppVersion(`SPX Broadcast v${data.version}`);
                }
                if (data.id) {
                    setHostID(data.id);
                }
                if (data.license) {
                    setLicense(data.license.days + " days remaining");
                }
            } catch (err) {
                if (cancelled) return;
                if (attempt < maxAttempts) {
                    setTimeout(() => fetchVersion(attempt + 1), retryDelay);
                } else {
                    console.error("Failed to fetch version after retries:", err);
                }
            }
        };

        fetchVersion(1);
        return () => { cancelled = true; };
    }, [isRunning, port]);

    const licenseStatus = license;
    
    const serverAddress = `http://localhost:${port}`;

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
                        {appVersion}
                    </div>
                    <div
                        className={`info-item status ${isRunning ? "running" : "stopped"}`}
                    >
                        {statusMsg}
                    </div>
                    {isRunning && (
                        <div className="info-item address">
                            <a
                                href={serverAddress}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "inherit", textDecoration: "underline" }}
                            >
                                {serverAddress}
                            </a>
                        </div>
                    )}
                </div>
                <div className="btn-section">
                    <button
                        className={`launch-btn ${isRunning ? "stop" : "launch"}`}
                        onClick={toggleServer}
                    >
                        {isRunning ? "STOP" : "LAUNCH"}
                    </button>
                    <button className="outline-btn">Logs...</button>
                    <button className="outline-btn">Help...</button>
                    <button className="outline-btn">Support...</button>
                </div>
            </div>

            {/* Row 3: Footer */}
            <div className="footer-row">
                <div className="footer-info">
                    <div className="footer-text">HostID: {hostID}</div>
                    <div className="footer-text">
                        Uptime: {formatUptime(uptime)}
                    </div>
                    <div className="footer-text">License: {licenseStatus}</div>
                </div>
            </div>
        </main>
    );
}

export default App;
