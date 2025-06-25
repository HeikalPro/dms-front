// src/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css"; // Ensure the CSS is imported if not already done in index.js
import logo from "./assets/goai247_logo.png";
import brandLogo from "./assets/brand360.svg";
import { apiUrl } from "./api";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginMessage("");

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Save token (or any data) to localStorage if you want to protect routes
        localStorage.setItem("jwt_token", data.access_token || "dummy_token");
        localStorage.setItem("user_id", data.user_id);
        setLoginMessage("Login successful!");
        // Redirect to the main App
        window.location.href = "/app";
      } else {
        const errData = await response.json();
        setLoginMessage("Login failed: " + errData.detail);
      }
    } catch (error) {
      console.error(error);
      setLoginMessage("An error occurred!");
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   // Bypass the API call and simulate a successful login
  //   localStorage.setItem("jwt_token", "dummy_token");
  //   localStorage.setItem("user_id", "123"); // use any mock user ID
  //   setLoginMessage("Login successful!");
  //   window.location.href = "/app"; // Redirect to the chatbot 
  // };
  

  return (
    <div className="container">
      
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="logo-container">
          <img src={brandLogo} alt="brandLogo" class ="logo" />
          </div>
          <h2>Login</h2>
          <div className="form-group">
            <label >
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            </div>
            <div className="form-group">
            <label>
            
            Password
              <i className="fa-solid fa-lock"></i>
            </label>
            <input
              type="password"
              id="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            </div>
          <button type="submit" className="login-button">Login Now</button>
          {loginMessage && <div className="message">{loginMessage}</div>}
          <div className="register">
            <p className="text-center">
              Don't have an account? <a href="/register">Sign up</a>
            </p>
          </div>
        </form>
          
    

      {/* <div className="r-side goai-logo-side">
        <img src={logo} alt="GoAI Logo" className="goai-logo" />
      </div> */}
    </div>
  );
}

export default LoginPage;
