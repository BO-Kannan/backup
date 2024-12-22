import { useState } from "react";
import { useNavigate, useSearchParams ,Link} from "react-router-dom"; // To parse query params and handle navigation
import AuthForm from "../components/AuthForm";
import logo from '../assets/images/mylogo.png';


const ResetPasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false); // For showing processing state
    const [searchParams] = useSearchParams(); // To get query parameters
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent form default submission

        // Extract token from URL query parameters
        const token = searchParams.get("token");

        if (!token) {
            setMessage("Invalid or missing reset token.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        setLoading(true); // Start loading state

        try {
            const response = await fetch("http://localhost:5000/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                // Redirect to login page after a short delay
                setTimeout(() => {
                    alert("Password reset successful!");
                    navigate("/login");
                }, 2000);
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            setMessage("Server error, please try again later.");
        } finally {
            setLoading(false); // End loading state
        }
    };

    return (
        <div className="auth reset-password-page">
            <AuthForm onSubmit={handleSubmit}>
                <img src={logo} alt="logo" className="logo" height="30px" />
                <p className="form-head">Reset Password</p>
                <div className="form-group">
                    <label>New Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Processing..." : "Reset Password"}
                </button>
                {message && <p className="message">{message}</p>}

                <span className="return-link">
                <Link to="/login">Return to Login</Link>
                </span>
            </AuthForm>
        </div>
    );
};

export default ResetPasswordPage;
