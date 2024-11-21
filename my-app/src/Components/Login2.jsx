import React from "react";
import "../Styles/Login2.css";
import Meta from "../Assets/Images/MetaMask.png";
import Logo from "../Assets/Images/Logo.png";
import { useNavigate } from "react-router-dom";

function Login2() {
    const navigate = useNavigate();
    async function requestAccount() {
        if (window.ethereum) {
            console.log("Detected!");

            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                navigate("/maps");
                console.log(accounts);

            } catch (error) {
                console.log("Error Connecting..", error);
            }
        } else {
            alert("MetaMask not detected!");
        }
    }

    return (
        <>
            <div className="Login-Main-Container">
                <div className="Inner-Container-Login">
                    <img className="Logo-Login" src={Logo} alt="BlockRide-Logo" />
                    <div className="Login-radio-group">
                        <label className="radio-option">
                            <input type="radio" name="options" value="option1" />
                            <img src={Meta} alt="Option 1" className="ImageMetaMask" />
                            MetaMask
                        </label>
                    </div>
                    <button onClick={requestAccount} className="Login-Button-Client">Connect Wallet</button>
                </div>
            </div>
        </>
    );
}

export default Login2;
