import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import logo from '../../assets/images/mylogo.png';
import ImageUpload from "./ImageUpload";

const Dashboard = () => {
    const [selectedTool, setSelectedTool] = useState("Image Compressor");
    const navigate = useNavigate(); // Initialize navigate
    const sessionId = sessionStorage.getItem("sessionId"); // Retrieve sessionId from sessionStorage

    useEffect(() => {
        // Redirect to login if sessionId is not found
        if (!sessionId) {
            navigate("/login");
        }
    }, [sessionId, navigate]); // Dependency array ensures this runs on mount

    const tools = [
        "Image Compressor",
        "Form API Generator",
        "Cleanup Tool",
    ];

    const toolsother = [
        "Account",
        "Settings",
    ];

    const logout = async () => {
        if (!sessionId) {
            console.error("No session ID found.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });

            const data = await response.json();
            if (response.ok) {
                console.log(data.message); // Logout successful
                sessionStorage.removeItem("sessionId"); // Clear sessionId from storage
                navigate("/login"); // Redirect to login page
            } else {
                console.error(data.error);
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    const renderToolComponent = () => {
        switch (selectedTool) {
            case "Image Compressor":
                return <div><ImageUpload /></div>;
            case "Form API Generator":
                return <div>Form API Generator Component</div>;
            case "Cleanup Tool":
                return <div>Cleanup Tool Component</div>;
            default:
                return <div>Select a tool to get started</div>;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <img src={logo} alt="logo" className="logo-client" height="28px" />
                <div className="header-actions">
                    <span className="icon">🔔</span>
                    <span className="icon">✉️</span>
                    <span className="icon" onClick={logout}>Logout</span>
                </div>
            </header>

            <div className="dashboard-body">
                {/* Left Sidebar */}
                <aside className="dashboard-sidebar">
                    <div className="primary-nav">
                        <p className="heading">Dashboard</p>
                        <ul>
                            {tools.map((tool, index) => (
                                <li
                                    key={index}
                                    className={selectedTool === tool ? "active" : ""}
                                    onClick={() => setSelectedTool(tool)}
                                >
                                    {tool}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <ul className="other-nav">
                        {toolsother.map((tool, index) => (
                            <li
                                key={index}
                                className={selectedTool === tool ? "active" : ""}
                                onClick={() => setSelectedTool(tool)}
                            >
                                {tool}
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Right Panel */}
                <main className="dashboard-panel">
                    <h2 className="selecttool">{selectedTool}</h2>
                    {renderToolComponent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
