import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import "./App.css";

function App() {
    const [isRunning, setIsRunning] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [uptime, setUptime] = useState(0);
    const [port, setPort] = useState("5660");
    const [appVersion, setAppVersion] = useState("SPX Broadcast");
    const [license, setLicense] = useState("");
    const [hostID, setHostID] = useState("");
    // const logsEndRef = useRef<HTMLDivElement>(null);

    const discord = "https://discord.com/invite/DcdNZfYsFP";
    const docs = "https://docs.spxgraphics.com/Welcome+to+SPX+Docs";

    async function openLogsFolder() {
        await invoke("open_logs_folder");
    }


    // Fetch port from backend (defaults to 5660, or uses CLI argument if provided)
    // When running the app, you can specify a different port like this:
    // npm run tauri dev -- -- 5660
    useEffect(() => {
        invoke<string>("get_port").then((p) => setPort(p));
    }, []);

    // Fetch app version from API when server is running (with retry)
    useEffect(() => {
        if (!isRunning) {
            setIsReady(false);
            return;
        }

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
                setIsReady(true);
                setStatusMsg("Server is running");
            } catch (err) {
                if (cancelled) return;
                if (attempt < maxAttempts) {
                    setTimeout(() => fetchVersion(attempt + 1), retryDelay);
                } else {
                    console.error("Failed to fetch version after retries:", err);
                    setStatusMsg("Failed to connect to server");
                }
            }
        };

        fetchVersion(1);
        return () => { cancelled = true; };
    }, [isRunning, port]);

    const licenseStatus = license;
    
    const serverAddress = `http://localhost:${port}`;

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
                setStatusMsg("Server is starting up...");
                const response = await invoke<string>("launch_server");
                console.log(response);
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
                    {isReady && (
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
                    <button className="outline-btn" onClick={openLogsFolder}>Logs...</button>
                    <button 
                        className="outline-btn"
                        onClick={() => openUrl(docs)}
                    >
                        Help...
                    </button>
                    <button
                        className="outline-btn"
                        onClick={() => openUrl(discord)}
                    >
                        Support...
                    </button>
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
