               
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

function DriverMap() {
    const navigate = useNavigate();
    const [currentPosition, setCurrentPosition] = useState(null);
    const [driverId, setDriverId] = useState(null); // Store the unique driverId
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [metaAccount, setMetaAccount] = useState(null);
    const [clientSearchActive, setClientSearchActive] = useState(null);

    const fetchMetaAccount = async () => {
        if (window.ethereum) {
            try {
                // Request accounts from MetaMask
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setMetaAccount(accounts[0]); // Set the first account
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
    
            //NearestClient
    
            let nearestClientId = null;  // Variable to store the nearest driver ID
            let shortestDistance = Infinity;  // Initialize with a large number for comparison
    
            response.data.forEach((client, index) => {
                const distance = calculateDistance(client.latitude, client.longitude, currentPosition.lat, currentPosition.lng);
                console.log(`Client ${index + 1}:`, client);
                console.log("Distance:", distance);
        
                // Update the nearest driver if this distance is shorter
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestClientId = client.clientId;  
                }
            });
    
            console.log("Nearest ClientID:", nearestClientId);
            //Setting Destination
            ClientDestinationSetting(nearestClientId);


        
        } catch (error) {
            console.error("Error fetching Clients:", error);
        }
    }

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
    

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    };


    useEffect(() => {
        getCurrentLocation();
        verifyCookie(); 
        fetchDriverId(); 
        SetDestination();

    }, []);

    useEffect(() => {
        if (driverId) {
            UpdateLocation(); // Update location once driverId is fetched
        }
    }, [currentPosition, driverId]); // Update when position or driverId changes
    useEffect(() => {
        if (currentPosition) {
            SetDestination(); 
        }
    }, [currentPosition]);
    const defaultPosition = {
        lat: 43.6532, 
        lng: -79.3832
    };

    const destination = {
        lat: 43.6596, 
        lng: -79.3960  
    };

    return (
        <div className="DriverMap-MainContainer">
            <div>
                <img src={Logo} className="Car-Logo" alt="Logo" />
                {clientSearchActive ? (<>
                </>) : ( 
                    <>
                        <p className="Driver-Search-Para">Searching For Clients...</p>
                        <div className="SearchingClient"></div>
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

        directionsService.route({
            origin: new window.google.maps.LatLng(origin.lat, origin.lng),
            destination: new window.google.maps.LatLng(destination.lat, destination.lng),
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        }, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
                setRoutes(result.routes);
            } else {
                console.error("Directions request failed due to " + status);
            }
        });
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
