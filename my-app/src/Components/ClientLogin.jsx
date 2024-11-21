import React from "react";
import Header from "./Header";
import Meta from "../Assets/Images/MetaMask.png";
import { useNavigate } from "react-router-dom";
import "../Styles/DriverLogin.css";
import ClientLogo from "../Assets/Images/Client-Logo.jpg";
import axios from 'axios';

function DriverLogin() {
    const navigate = useNavigate();

async function requestAccount() {
    if (window.ethereum) {
        console.log("MetaMask Detected!");

        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            
            console.log("Ethereum Accounts:", accounts);

            // Make the axios POST request to the backend
            axios({
                method: 'post',
                url: 'http://localhost:8080/login',
                data: { username: accounts[0] }, // Send Ethereum account data
                withCredentials: true, // Allow the browser to send/receive cookies
            })
            .then(response => {
                // Handle successful response
                console.log("Response from backend:", response.data);

                // Optionally navigate to /maps after a successful response
                navigate("/ClientMaps");
            })
            .catch(error => {
                // Handle error response
                console.error("Error during login:", error);
            });
            
        } catch (error) {
            console.log("Error Connecting to MetaMask:", error);
        }
    } else {
        alert("MetaMask not detected!");
    }
}


    return (
        <>
        <Header></Header>
            <div className="Login-Main-Container">
                <div className="Inner-Container-Login">
                    <div className="Left-Container">
                        <img className ="Drivers-Logo" src={ClientLogo} ></img>
                    </div>
                    <div className="Right-Container">
                        <img src={Meta} className="Meta-Logo"></img>
                        <p className="DriverText">Driver Login</p>
                        <button onClick={requestAccount} className="Login-Button-Client">Connect Wallet</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default DriverLogin;
