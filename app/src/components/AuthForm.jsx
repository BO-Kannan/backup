const AuthForm = ({ children, onSubmit }) => {
    return (
        <form onSubmit={onSubmit} className="auth-forms">
            {children}
        </form>
    );
};

export default AuthForm;
