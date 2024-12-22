import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import AuthForm from "../components/AuthForm"; // Import useNavigate hook to handle redirection
import logo from '../assets/images/mylogo.png';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const navigate = useNavigate(); // Initialize the navigate function

    const formFields = [
        { label: "Email", name: "email", type: "email" },
        { label: "Password", name: "password", type: "password" },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email.";
        }

        if (!formData.password) {
            newErrors.password = "Please enter the password";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
        } else {
            setErrors({});
            try {
                const response = await fetch("http://localhost:5000/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
    
                const data = await response.json();
    
                if (response.ok) {
                    alert(data.message); // Show success message
                    console.log("Login successful:", data);
    
                    // Store session ID in sessionStorage
                    sessionStorage.setItem("sessionId", data.sessionId);
    
                    // Navigate to dashboard
                    navigate("/dashboard");
                } else {
                    alert(data.error); // Show error message
                }
            } catch (error) {
                console.error("Error logging in:", error);
                alert("Server error, please try again later.");
            }
        }
    };
    

    return (
        <div className="auth login-page">

            <AuthForm>
                <img src={logo} alt="logo" className="logo" height="30px" />
                <p className="form-head">Login Form</p>
                {formFields.map((field) => (
                <div key={field.name} className="form-group">
                    <label>{field.label}:</label>
                    <input type={field.type} name={field.name} value={formData[field.name]} onChange={handleChange}
                        autoComplete="off" />
                    {errors[field.name] && <p className="error">{errors[field.name]}</p>}
                    {field.name === "password" && (
                    <div className="forgot-password">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>
                    )}
                </div>
                ))}

                <button type="submit" onClick={handleSubmit} className="btn btn-primary">
                    Login
                </button>
                <span className="return-link">
                <Link to="/">New User ?</Link>
                </span>
            </AuthForm>
        </div>
    );
};

export default LoginPage;
