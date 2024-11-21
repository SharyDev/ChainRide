import React from "react";
import "../Styles/Login.css";
import "../Assets/Images/Login-Background.png";


function Login () {
    async function requestAccount() {
        if(window.ethereum)
        {
            console.log("Detected.!");

            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                console.log(accounts);
            } catch (error) {
                console.log("Error Connection..");
            }
        }
        else {
            alert("Meta Mask not detected.!");
        }
    }
    return(
        <>
            <div className="Login-Main-Container">
                <div className="Login-InnerContainer">
                    <div className="Left-Container">
                        <button className="Driver-Button" onClick={requestAccount}>
                            <span>Driver</span>
                        </button>
                    </div>
                    <div className="Right-Container">
                    <button className="Client-Button" onClick={requestAccount}>Client</button>
                    </div>
                </div>
            </div>
        </>
    );
} 

export default Login;