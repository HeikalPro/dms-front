import React, { useState } from "react";
import "./style.css";
import logo from "./assets/goai247_logo.png";
import { apiUrl } from "./api";
import brandLogo from "./assets/brand360.svg";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage("");

    if (password !== confirmPassword) {
      setRegisterMessage("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        setRegisterMessage("Registration successful! You can now log in.");
      } else {
        const data = await response.json();
        if (Array.isArray(data.detail)) {
          const messages = data.detail.map((err) => {
            let msg = err.msg;
            if (msg.toLowerCase().startsWith("value error,")) {
              msg = msg.replace(/^value error,\s*/i, "");
            }
            return msg;
          }).join("\n");
          setRegisterMessage("Registration failed:\n" + messages);
        } else if (typeof data.detail === "string") {
          setRegisterMessage("Registration failed: " + data.detail);
        } else {
          setRegisterMessage("Registration failed. Please try again.");
        }
      }
    } catch (err) {
      console.log(err);
      setRegisterMessage("An error occurred!");
    }
  };

  return (
    <div className="container">
      
      {/* LEFT SIDE */}
        <form
          className="register-form"
          id="register-form"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className="logo-container">
          <img src={brandLogo} alt="brandLogo" class ="logo" />
          </div>
          <h2>Register</h2>

          {/* ✅ Dummy autofill trap fields */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            style={{ display: "none" }}
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            style={{ display: "none" }}
          />

          {/* username input */}
          <div className="form-group">
            <label>
              Username
            </label>
            <input
              type="text"
              id="username"
              name="new-username"
              placeholder="username"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          {/* email input */}
          <div className="form-group">
            <label>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="new-email"
              placeholder="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {/* password input */}
          <div className="form-group">
            <label >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="new-password"
              placeholder="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* confirm password */}
          <div className="form-group">
            <label >
            Confirm_Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="new-confirm-password"
              placeholder="confirm password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="register-button">Register Now</button>
          {registerMessage && <div className="message">{registerMessage}</div>}

          <div>
          <p className="text-center">
            Already have an account? <a href="/">Login</a>
          </p>
        </div>
        </form>

        

    
    </div>
  );
}

export default RegisterPage;
