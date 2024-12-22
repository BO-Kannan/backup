import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import AuthForm from "../components/AuthForm";
import logo from '../assets/images/mylogo.png';


const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false); // State to handle loading
    const navigate = useNavigate(); // Hook for navigation

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior
        setLoading(true); // Start loading state

        try {
            const response = await fetch("http://localhost:5000/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            // Show alert and redirect after 2 seconds
            setTimeout(() => {
                alert(data.message); // Display the message in an alert
                navigate("/login"); // Redirect to the login page
            }, 2000);
        } catch (error) {
            alert("Try again, please.");
        } finally {
            setLoading(false); // Stop loading state
        }
    };

    return (
        <div className="auth forgot-password-page">
            <AuthForm onSubmit={handleSubmit}>
                <img src={logo} alt="logo" className="logo" height="30px" />
                <p className="form-head">Forgot Password</p>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Processing..." : "Send Reset Email"}
                </button>
                <span className="return-link">
                <Link to="/login">Return to Login</Link>
                </span>
            </AuthForm>
            {/* Add Return to Login link */}
            
        </div>
    );
};

export default ForgotPasswordPage;
