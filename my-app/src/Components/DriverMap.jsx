               
/* global google */
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
    APIProvider,
    Map,
    useMapsLibrary,
    useMap,
    Marker
} from "@vis.gl/react-google-maps";
import axios from "axios";
import Thumbnail from "../Assets/Images/Car-Thumbnail.png";
import DestinationMarker from "../Assets/Images/DestinationMarker.png";
import "../Styles/DriverMap.css";
import Logo from "../Assets/Images/Logo.png";
import ChainRideContract from "../Contracts/ChainRideContract.json";
import Web3 from 'web3';



function DriverMap() {
    const navigate = useNavigate();
    const [currentPosition, setCurrentPosition] = useState(null);
    const [driverId, setDriverId] = useState(null);
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [rideCompletionCheck, setRideCompletionCheck] = useState(null);
    const [metaAccount, setMetaAccount] = useState(null);
    const [clientSearchActive, setClientSearchActive] = useState(null);
    const [clientData,setClientData] = useState(null);
    const [foundRide,setFoundRide] = useState(null);
    const [acceptRide,setAcceptRide] = useState(null);
    const [shorestDistance,setshorestDistance] = useState(null);
    const [rideCost,setRideCost] = useState(null);
    const [rideAccepted,setRideAccepted] = useState(false);
    const [processing,setProcessing] = useState(false);
    const [recievedRide,setRecievedRide] = useState(false);
    const [driverInitalData,setdriverInitalData] = useState(false);
    const [destination,setDestination] = useState({
        lat: 43.6596, 
        lng: -79.3960  
    });
   const [totalTime,setTotalTime] = useState(null)

    const fetchMetaAccount = async () => {
        if (window.ethereum) {
            try {
                // Request accounts from MetaMask
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setMetaAccount(accounts[0]); 
            } catch (error) {
                console.error("Error fetching MetaMask account:", error);
                setError("MetaMask connection error");
            }
        } else {
            setError("MetaMask is not installed");
        }
    };

    async function UpdateLocation() {
        fetchMetaAccount();
        if (!currentPosition || !driverId || !metaAccount) return; 
        const { lat: latitude, lng: longitude } = currentPosition;
        console.log("Updating location...");

        try {
            const response = await axios.post('http://localhost:8080/api/save-Driver-location', {
                driverId,
                latitude,
                longitude,
                metaAccount  
            }, { withCredentials: true });

            setdriverInitalData(response.data);

            console.log("Response from backend:", response.data);
        } catch (error) {
            console.error("Error updating location:", error);
        }
    }

    // Function to get a unique driverId from the backend
    const fetchDriverId = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/generate-driver-id"); // Assuming this endpoint generates driverId
            setDriverId(response.data.driverId);
        } catch (error) {
            console.error("Error fetching driverId:", error);
        }
    };

   
    // Get current geolocation
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log("Driver Location: " + latitude + " : " + longitude);
                    setCurrentPosition({ lat: latitude, lng: longitude });
                },
                (err) => {
                    setError("Error: " + err.message);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    };

    // Verify user authentication
    const verifyCookie = async () => {
        try {
            const response = await axios.post("http://localhost:8080/Verify", null, {
                withCredentials: true 
            });
            setVerificationResult(response.data);
        } catch (err) {
            console.error("Verification failed:", err);
            navigate("../DriverLogin");
            setVerificationResult(null);
        }
    };

   
    const SetDestination = async () => {
        if (!currentPosition) {
            console.error("Current position is not available yet.");
            return;
        }
    
        try {
            console.log("Fetching all clients...");
            const response = await axios.get("http://localhost:8080/api/Get-All-Clients");
    
            // Log the entire response object
            console.log("Response received:", response);
    
            let nearestClientId = null;
            let shortestDistance2 = Infinity;
            let TotalDistance = 0; // Track total distance outside the loop
    
            // Loop through each client
            response.data.forEach((client, index) => {
                const distance = calculateDistance(client.latitude, client.longitude, currentPosition.lat, currentPosition.lng);
                console.log(`Client ${index + 1}:`, client);
                console.log("Distance:", distance);
    
                // Update the nearest client if this distance is shorter
                if (distance < shortestDistance2) {
                    shortestDistance2 = distance;
                    nearestClientId = client.clientId;
    
                    // Calculate the distance from the client to their destination
                    const clientDestinationDistance = calculateDistance(client.latitude, client.longitude, client.ClientDestinationLatiture, client.ClientDestinationLongitude);
                    const TotalDistance = parseFloat(clientDestinationDistance) + parseFloat(shortestDistance2);
                 
    
                    // Update state after calculations are done
                    setClientData(client);
                    setshorestDistance(TotalDistance);
                    setRideCost(clientDestinationDistance * 0.00000029);
                    console.log("Cost Of Ride:"+rideCost);
                }
            });
    
            // You might want to log or use nearestClientId after the loop
            console.log("Nearest ClientID:", nearestClientId);
    
        } catch (error) {
            console.error("Error fetching Clients:", error);
        }
    };
    
    
    const ClientDestinationSetting = async (nearestClientId) => {
        try {
            console.log("Fetching Nearest clients...");
            
           
            const response = await axios.get("http://localhost:8080/api/Get-Nearest-Client", {
                params: { clientId: nearestClientId }  
            });
            
            
            console.log("Response received:", response);
    
        } catch (error) {
            console.error("Error fetching nearest client:", error);
        }
    }
    
    
const RideCompleted = async () => {
    UpdateLocation();
    console.log("clientData:", clientData); // Add this to debug
    if (!clientData) return;
    
    const currLat = parseFloat(currentPosition.lat);
    const currLng = parseFloat(currentPosition.lng);
    const clientLat = parseFloat(clientData.ClientDestinationLatiture);
    const clientLng = parseFloat(clientData.ClientDestinationLongitude);
    let RideComplionDistance = null;
    
    RideComplionDistance = calculateDistance(currLat, currLng, clientLat, clientLng);
    console.log(`Ride Inproess <-----...`);
    console.log(RideComplionDistance);
    if (RideComplionDistance < 6) {
        setRideCompletionCheck(true);
        console.log(`Ride Completed...`);
        const dummyAddress = "0x1c1339e7797fFDDe9f9c7D59386415e4B42A2a60"; 
        // Assuming you've initialized Web3.js and have the contract ABI and address
        const contractAddress = "0x1c1339e7797fFDDe9f9c7D59386415e4B42A2a60"; // Replace with actual contract address
        const abi = ChainRideContract.abi;
    
        // Connect to Ethereum provider (Metamask or other wallet)
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            window.ethereum.enable();  // Request access to the user's accounts
    
            const contract = new web3.eth.Contract(abi, contractAddress);
    
            // Parameters to pass to the contract
            const price = 10;  // Assuming the price is stored in clientData
            const distance = parseInt(RideComplionDistance);
            const initialLongitude = parseInt(currentPosition.lng);  // Scaling for better precision
            const initialLatitude = parseInt(currentPosition.lat);
            const finalLongitude = parseInt(clientData.ClientDestinationLongitude);
            const finalLatitude = parseInt(clientData.ClientDestinationLatiture);
            const clientMetaAccount = "0x1c1339e7797fFDDe9f9c7D59386415e4B42A2a60";  // Assuming client's address is stored in clientData
            const driverMetaAccount = "0xC17ed6C2225D867c6fe8e01f728E27E844FD418D";  // Assuming driver's address is available
           
            // Get the current user's Ethereum account
            web3.eth.getAccounts().then(accounts => {
                const signer = accounts[0]; // Use the first account
    
                // Send the transaction to the smart contract
                contract.methods
                    .recordTrip(
                        price,
                        distance,
                        initialLongitude,
                        initialLatitude,
                        finalLongitude,
                        finalLatitude,
                        clientMetaAccount,
                        driverMetaAccount
                    )
                    .send({
                        from: signer,
                        value: web3.utils.toWei('4', 'ether'),  // Adjust ETH value as needed
                        gas: 2000000  // Set an appropriate gas limit
                    })
                    .on('transactionHash', (hash) => {
                        console.log(`Transaction hash: ${hash}`);
                    })
                    .on('receipt', (receipt) => {
                        console.log('Transaction receipt:', receipt);
                    })
                    .on('error', (error) => {
                        console.error('Error recording trip:', error);
                    });
            }).catch(error => {
                console.error('Error getting accounts:', error);
            });
        } else {
            console.log('Ethereum provider not found. Please install MetaMask or another Ethereum wallet.');
        }
    } else {
        console.log("Destination does not match the client destination.");
    }    
};
    
    const costCalculate = () => {
        const ethToUsdRate = 3427.24; 
        const baseRatePerKmUsd = 1; 


        const costPerMeter = (baseRatePerKmUsd / 1000) / ethToUsdRate;
        if(costPerMeter< 0.00000000)
        {
            costPerMeter = 0.00000001;
        }
        console.log("Cost per meter in ETH:", costPerMeter.toFixed(8));

    }
    
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let meters =  R * c;
        meters = 1000 * meters;
        let roundedMeters = meters.toFixed(3);
        return roundedMeters; 
    };

  const RadiusCheck = () => {
    if(shorestDistance <= 5)
    {
        setProcessing(true);
    }
  }
  const Transaction = () => {
    
  }

  const Received = () => {
    setRideAccepted(true);
    setRecievedRide(true);
    setDestination({
        lat: clientData.ClientDestinationLatiture,
        lng: clientData.ClientDestinationLongitude
    }
    )

  }

    useEffect(() => {
        RideCompleted();
        RadiusCheck();
        costCalculate();
        getCurrentLocation();
        verifyCookie(); 
        fetchDriverId(); 
      

    }, []);
   

    useEffect(() => {
        if (clientData) {
            console.log("Nearest:", clientData);
            setDestination({
                lat: clientData.latitude, 
                lng: clientData.longitude   
            });

            console.log("Nearest: -->", destination.lat);
            console.log("Nearest:<---", destination.lng);
            
        }
       
    }, [clientData]);

    
    
    useEffect(() => {
        if (driverId) {
            UpdateLocation(); 
        }
    }, [currentPosition, driverId]);
    useEffect(() => {
        if (currentPosition) {
            SetDestination(); 
        }
    }, [currentPosition]);

    

    return (
        <div className="DriverMap-MainContainer">
            <div>
                <img src={Logo} className="Car-Logo" alt="Logo" />
                {clientSearchActive ? (<>
                </>) : ( 
                    <>
                        <p className="Driver-Search-Para">Searching For Clients...</p>
                        <p>{clientData ? (
                    <div>
                        {setFoundRide ? (
                            <>
                                <div className="Ride-Found-Container">
                                    <p>Client ID: {clientData.clientId}</p>
                                    <p>Distance: {shorestDistance} Meters</p>
                                    <p>Earn: {rideCost} ETH</p>
                                    {rideAccepted ? (
                                        <>
                                           {processing ? (
                                            <>
                                                {recievedRide ? (
                                                    <>
                                                        {rideCompletionCheck ? (
                                                            <>
                                                                
                                                            </>
                                                        ): (
                                                            <>
                                                                <button onClick={RideCompleted}> Ride Completed</button>
                                                            </>
                                                        )}
                                                       
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="Ride-Accept-Button" onClick={Received}>Received</button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="SearchingClient"></div>
                                            </>
                                        )} 
                                        </>
                                    ) :
                                    (
                                        <>
                                            <button className="Ride-Accept-Button" onClick={e => {
                                                setRideAccepted(true);
                                            }}>Accept</button>
                                        </>
                                    ) }

                                    
                               </div>
                            </>)
                        :
                        (<>

                        </>)}
                         

                    </div>
                ) : (
                    <div className="SearchingClient"></div>
                )}</p>
                        
                    </>
                )}
                
            </div>
            <div style={{ height: "100vh", width: "100%" }}>
                <APIProvider apiKey="AIzaSyAMttRSkFiAkH6dnt5m840609PAiHHxy3o">
                    <Map fullscreenControl={false}>
                        {currentPosition && (
                            <Directions origin={currentPosition} destination={destination} />
                        )}
                    </Map>
                </APIProvider>
            </div>
        </div>
    );
}

function Directions({ origin, destination }) {
    const map = useMap();
    const routesLibrary = useMapsLibrary("routes");

    const [directionsService, setDirectionsService] = useState(null);
    const [directionsRenderer, setDirectionsRenderer] = useState(null);
    const [routes, setRoutes] = useState(null);

     useEffect(() => {
        if (!routesLibrary || !map || typeof window.google === 'undefined') return;

        const service = new routesLibrary.DirectionsService();
        const renderer = new routesLibrary.DirectionsRenderer({ 
            map, 
            suppressMarkers: true 
        });
        setDirectionsService(service);
        setDirectionsRenderer(renderer);
    }, [routesLibrary, map]);

    useEffect(() => {
        if (!directionsService || !directionsRenderer || typeof window.google === 'undefined') return;
    
        // Ensure origin and destination are defined
        if (!origin || !destination) return;
    
        // Clear previous directions
        directionsRenderer.setDirections({ routes: [] });
    
        // Request a new route
        directionsService.route(
            {
                origin: new window.google.maps.LatLng(origin.lat, origin.lng),
                destination: new window.google.maps.LatLng(destination.lat, destination.lng),
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(result);
                    setRoutes(result.routes); // Update state with the new route
                } else {
                    console.error("Directions request failed due to " + status);
                }
            }
        );
    }, [directionsService, directionsRenderer, origin, destination]);
    
   

    return (
        <>
            {origin && (
                <Marker
                    position={origin}
                    icon={{
                        url: Thumbnail,
                        scaledSize: new window.google.maps.Size(60, 40) 
                    }}
                />
            )}
            {destination && (
                <Marker
                    position={destination}
                    icon={{
                        url: DestinationMarker, 
                        scaledSize: new window.google.maps.Size(20, 35)
                    }}
                />
            )}
        </>
    );
}

export default DriverMap;
