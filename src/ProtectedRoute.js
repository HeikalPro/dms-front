import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("jwt_token");

  return userId && token ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
