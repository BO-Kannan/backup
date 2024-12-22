import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import AuthForm from "../components/AuthForm";
import logo from '../assets/images/mylogo.png';


const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});
    const navigate = useNavigate(); // Initialize the navigate function

    const formFields = [
        { label: "Email", name: "email", type: "email" },
        { label: "Name", name: "name", type: "text" },
        { label: "Password", name: "password", type: "password" },
        { label: "Confirm Password", name: "confirmPassword", type: "password" },
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

        if (!formData.name || formData.name.length < 3) {
            newErrors.name = "Name must be at least 3 characters long.";
        }

        if (!formData.password || formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters long.";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
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
            console.log("Registration data:", formData);
    
            try {
                const response = await fetch("http://localhost:5000/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });
    
                const data = await response.json();
    
                if (response.ok) {
                    alert(data.message); // Show success message
                    console.log("Registration successful:", data);
                    navigate("/login"); // Redirect to the login page after successful registration
                } else {
                    alert(data.error); // Show error message
                }
            } catch (error) {
                console.error("Error registering:", error);
                alert("Server error, please try again later.");
            }
        }
    };

    return (
        <div className=" auth register-page">
            <AuthForm>
            <img src={logo} alt="logo" className="logo" height="30px" />
                <p className="form-head">Register Form</p>
                {formFields.map((field) => (
                    <div key={field.name} className="form-group">
                        <label>{field.label}:</label>
                        <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            autoComplete="off"
                        />
                        {errors[field.name] && <p className="error">{errors[field.name]}</p>}
                    </div>
                ))}
                <button type="submit" onClick={handleSubmit} className="btn btn-primary">
                    Register
                </button>
                <span className="return-link">
                <Link to="/login">Already Have an Account ?</Link>
                </span>
            </AuthForm>
        </div>
    );
};

export default RegisterPage;
