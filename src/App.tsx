import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
    const [isRunning, setIsRunning] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

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
                    {/* Detailed status info can go here later */}
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
