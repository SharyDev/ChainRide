               
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
import axios, { Axios } from "axios";
import Thumbnail from "../Assets/Images/Car-Thumbnail.png";
import DestinationMarker from "../Assets/Images/DestinationMarker.png";
import "../Styles/DriverMap.css";
import Logo from "../Assets/Images/Logo.png";



function DriverMap() {
    const navigate = useNavigate();
    const [currentPosition, setCurrentPosition] = useState(null);
    const [driverId, setDriverId] = useState(null);
    const [distance,setDistance] = useState(null);
    const [dursation,setDuration] = useState(null);
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [clientIdChecking,setClientIdChecking] = useState(true);
    const [rideCompletionCheck, setRideCompletionCheck] = useState(null);
    const [metaAccount, setMetaAccount] = useState(null);
    const [clientSearchActive, setClientSearchActive] = useState(null);
    const [clientData,setClientData] = useState(null);
    const [selectedclinetId,setSelectedClientId] = useState(null);
    const [foundRide,setFoundRide] = useState(null);
    const [shorestDistance,setshorestDistance] = useState(null);
    const [rideCost,setRideCost] = useState(null);
    const [rideAccepted,setRideAccepted] = useState(false);
    const [processing,setProcessing] = useState(false);
    const [recievedRide,setRecievedRide] = useState(false);
    const [driverInitalData,setdriverInitalData] = useState(false);
    const [initalMount,setInitalMount] = useState(true);
    const [destination,setDestination] = useState(null);
   const [totalTime,setTotalTime] = useState(null)
   const [clientSet,setClientSet] = useState(true);

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
                    console.log( "Distance: " +clientDestinationDistance + " : " + shortestDistance2);
                    console.log(shortestDistance2 + " <--- Here is the distance and * 1000 then *0.0000029")
                    let cost = parseFloat(distance);
                    // Update state after calculations are done
                    setClientData(client);
                    setDestination({
                        lat: client.ClientDestinationLatiture,
                        lng: client.ClientDestinationLongitude
                    });
                    
                    if(client && clientIdChecking)
                    {
                        setClientIdChecking(false);
                        setSelectedClientId(client.clientId);
                    }
                    setClientSet(true);
                    console.log("Client Selected Here: " + selectedclinetId);
                    
                    setshorestDistance(TotalDistance);
                    setRideCost((cost* 0.00000029).toFixed(8));
                    
                    let totalCost = (cost* 0.00000029).toFixed(8);

                    console.log("Cost Of Ride:"+rideCost + " : ->> " + cost);
                    if(totalCost)
                    {
                        axios.post("http://localhost:8080/api/set-Cost", {id:client.clientId ,cost: totalCost.toFixed(8)});
                    }
                }
            });
    
           
            console.log("Nearest ClientID:", nearestClientId);
    
        } catch (error) {
            console.error("Error fetching Clients:", error);
        }
    };
    useEffect(() => {
        if (selectedclinetId) {
            console.log("Updated selectedClientId:", selectedclinetId);
            setClient();  // Trigger the client data fetch
        } else {
            console.log("selectedclinetId is not set.");
        }
    }, [selectedclinetId]);  // Runs whenever selectedClientId changes
    
    const setClient = async () => {
        try {
           
            console.log("Making GET request to /api/get-client with clientId:", selectedclinetId);
            const response = await axios.get("http://localhost:8080/api/get-client", {
                params: { clientId: selectedclinetId }
            });
            setSelectedClientId(response.data.clientId);       
            console.log("Response received:", response.data);
            if (!response.data.clientPicked) {
                setDestination({
                    lat: response.data.latitude,
                    lng: response.data.longitude
                });
            }
            RadiusCheck(response.data);
            RideCompleted(response.data);
            setClientData(response.data);
    
        } catch (error) {
            console.error("Error fetching client data:", error);
            if (error.response) {
                console.error("Error Response:", error.response.data);
                console.error("Status Code:", error.response.status);
            }
        }
    };
    
    
   
    
    
    
const RideCompleted = async (response) => {
    UpdateLocation();
    setClientSearchActive(false);
    if (clientData === null) return;
    console.log(`Client Data here: -->` + clientData);
 
    let RideComplionDistance = null;
    
    let DriverDistance = calculateDistance(response.ClientDestinationLatiture, response.ClientDestinationLongitude, response.latitude, response.longitude);
    let Clientdistance =calculateDistance(currentPosition.lat,currentPosition.lng, response.longitude, response.latitude);

    RideComplionDistance = DriverDistance + Clientdistance;
    RideComplionDistance = parseFloat(RideComplionDistance);
    console.log(`Ride Inproess <-----...` + RideComplionDistance);
    console.log(RideComplionDistance);
    let id = clientData.clientId;

     
    if (RideComplionDistance < 10 && response.clientPicked ) {
        setRideCompletionCheck(true);
        
        try {
            const response = await axios.post("http://localhost:8080/api/set-RideComplete", {
                id
            });
            console.log("Response received:", response.data);
        } catch (error) {
            if (error.response) {
                // Server responded with a status code out of the 2xx range
                console.error("Error response from server:", error.response.data);
                console.error("Status code:", error.response.status);
            }
        }
        

        
        //////////////////////////
        console.log(`Ride Completed...`);
        
       

    } else {
        console.log("Destination does not match the client destination.");
    }    

    
    

};

    
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let km =  R * c;
        return km.toFixed(3); 
    };

  const RadiusCheck = (res) => {
   
    if(res || clientData)
    {
        let id = res.clientId;
      
        
        let distance = calculateDistance(res.latitude,res.longitude,currentPosition.lat,currentPosition.lng);
        distance = parseFloat(distance);
    
        console.log( "---->" + distance);
    if(distance < 10)
    {
        
        setProcessing(true);
        try {
        
            const response = axios.post("http://localhost:8080/api/set-Received", {
                id
            }, {
                withCredentials: true 
            });
            setVerificationResult(response.data);
        } catch (err) {
            console.error("Verification failed:", err);
        }
    }
    }
    


  }
 
  const DriverAceept = () => {
    setRideAccepted(true);
    
    setDestination({
        lat: clientData.latiture,
        lng: clientData.longitude
    });
    let cost = parseFloat(distance);
    cost = cost* 0.00000029;
    cost = cost.toFixed(8);
    axios.post("http://localhost:8080/api/driver-Accept", { id: clientData.clientId, driverId: driverId, costR: cost })
        .then(response => {
            console.log("Client assigned successfully:", response.data);
            
        })
        .catch(error => {
            console.error("Error accepting ride:", error.response?.data || error.message);
        });

       

};

  const Received = async () => {
    let id = clientData.clientId;
        
    try {
        
        
        setVerificationResult(response.data);
        const response = await axios.post("http://localhost:8080/api/set-DriverID", {
            id,driverId
        });
    } catch (err) {
        console.error("Verification failed:", err);
    }

   
    

    setRideAccepted(true);
    setRecievedRide(true);
    setDestination({
        lat: clientData.ClientDestinationLatiture,
        lng: clientData.ClientDestinationLongitude
    }
    )

  }

    useEffect(() => {
        
      
        getCurrentLocation();
        verifyCookie(); 
        fetchDriverId(); 
      

    }, []);

    useEffect(() => {
        setClient();
    
        const intervalId = setInterval(() => {
            setClient();
        }, 5000);
        return () => clearInterval(intervalId);
    }, [selectedclinetId]);

    useEffect(() => {
        setClient();
    
        const intervalId = setInterval(() => {
            setClient();
        }, 5000);
        return () => clearInterval(intervalId);
    }, [selectedclinetId]);
    

   /* useEffect(() => {
        if (clientData) {
            console.log("Nearest:", clientData);
            setDestination({
                lat: clientData.latitude, 
                lng: clientData.longitude   
            });

            console.log("Nearest: -->", destination.lat);
            console.log("Nearest:<---", destination.lng);
            
        }
       
    }, [clientData]);*/

    
    
    useEffect(() => {
        if (driverId) {
            UpdateLocation(); 
        }
    }, [currentPosition, driverId]);

   
   
    
    useEffect(() => {
        if (!clientSet) return; 
    
        const intervalId = setInterval(() => {
            SetDestination(); 
        }, 5000);
    
        return () => clearInterval(intervalId); 
    }, [currentPosition, clientSet]);
    

    

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
                                    <p>Distance: {distance} </p>
                                    <p>Duration: {dursation}</p>
                                    <p>Earn: {(parseFloat(distance) * 0.00000029).toFixed(8)} ETH</p>
                                    {rideAccepted ? (
                                        <>
                                           {processing ? (
                                            <>
                                                {recievedRide ? (
                                                    <>
                                                        {rideCompletionCheck ? (
                                                            <>
                                                                <button className="RideCompleted-Button" onClick={RideCompleted} > Ride Complete</button>
                                                             
                                                            </>
                                                        ): (
                                                            <>
                                                                
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
                                            <button className="Ride-Accept-Button" onClick={DriverAceept}>Accept</button>
                                        </>
                                    ) }

                                    
                               </div>
                            </>)
                        :
                        (<>
                                <div className="SearchingClient"></div>
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
                    <Map
                        fullscreenControl={false}
                        center={currentPosition || { lat: 43.6596, lng: -79.3960 }}
                        zoom={14}
                    >
                        {/* Render only the driver's current location marker if destination is not set */}
                        {currentPosition && (
                            <Marker
                                position={currentPosition}
                                icon={{
                                    url: Thumbnail,
                                    scaledSize: new window.google.maps.Size(60, 40)
                                }}
                            />
                        )}

                        {/* Render Directions only if both origin and destination are available */}
                        {currentPosition && destination && (
                            <Directions
                                origin={currentPosition}
                                destination={destination}
                                setDistance={setDistance}
                                setDuration={setDuration}
                            />
                        )}
                    </Map>
                </APIProvider>
            </div>
        </div>
    );
}

function Directions({ origin, destination, setDistance, setDuration }) {
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
    
                    // Update state with the new route
                    setRoutes(result.routes);
    
                    // Extract distance and duration
                    const route = result.routes[0];
                    const leg = route.legs[0];
                    const distance = leg.distance.text;
                    const duration = leg.duration.text;
    
                    setDistance(distance);
                    setDuration(duration);
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
