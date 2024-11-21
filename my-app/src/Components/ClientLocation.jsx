import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import {
    APIProvider,
    Map,
    useMapsLibrary,
    useMap,
    Marker
} from "@vis.gl/react-google-maps";
import Thumbnail from "../Assets/Images/Car-Thumbnail.png";
import DestinationMarker from "../Assets/Images/DestinationMarker.png";
import "../Styles/ClientMap.css";
import Logo from "../Assets/Images/Logo.png";

function ClientLocation() {
    const navigate = useNavigate();
    const [currentPosition, setCurrentPosition] = useState(null);
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [destinationInput, setDestinationInput] = useState("");
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [SearchRequest, setSearchRequest] = useState("");
   
    const [clientId, setClientId] = useState(null);
    const [searchActive, setSearchActive] = useState(false);
    const [selectedDriverData,setSelectedDriverData] = useState(null);
    const [driverLocation,setDriverLocation] = useState(null);
    const [clientMetaAccount, setClientMetaAccount] = useState("");
    //destination Target
    const [destination, setDestination] = useState({
        lat: 43.6596,
        lng: -79.3960  
    });
    //Current Location
    const [currentDestination,SetCurrentDestination] = useState({
        lat: 43.6596,
        lng: -79.3960  
    });


    const [clientLatitude, setClientLatitude] = useState(null);
    const [clientLongitude, setClientLongitude] = useState(null);

    const fetchMetaAccount = async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                const account = accounts[0]; // Get the first account
                setClientMetaAccount(account); // Set the MetaMask account
                return account; 
            } catch (error) {
                console.error("Error fetching MetaMask account:", error);
                return null; 
            }
        } else {
            console.error("MetaMask is not installed.");
            return null;
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
        return R * c; 
    };
    

    const getCurrentLocation = async () => {  
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => { 
                    const { latitude, longitude } = position.coords;
                    const clientLocation = {
                        lat: latitude,
                        lng: longitude
                    };
                    setCurrentPosition(clientLocation);
                    setClientLatitude(latitude);
                    setClientLongitude(longitude);
                    console.log("Client's current location:", clientLocation);
    
                   
                    let ClientAcount = await fetchMetaAccount();
                    console.log("Client Accounts--->:", ClientAcount);
    
                    
                   
                    saveLocation(clientLocation, ClientAcount);
                },
                (err) => {
                    setError("Error: " + err.message);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    };

    const saveLocation = async (location,ClientAcount) => {
        // Ensure clientId is fetched before sending the request
        if (!clientId) {
            console.error("Client ID is not available");
            return; // Don't proceed without a valid clientId
        }
        console.log("-----Working here--" + clientId);
        try {
            await axios.post("http://localhost:8080/api/save-client-location", {
                clientId,
                latitude: location.lat,
                longitude: location.lng,
                ClientDestinationLatiture: destination.lat,
                ClientDestinationLongitude: destination.lng,
                metaAccount: ClientAcount
            });
            console.log("Location saved successfully.");
        } catch (err) {
            console.error("Failed to save location:", err);
        }
    };
    
    const getNearestDriver = async (nearestDriverId) => {
        try {
            console.log("Fetched DriverId Here:", nearestDriverId);
           
           
            const response = await axios.get("http://localhost:8080/api/nearest-driver", {
                params: {
                    driverId: nearestDriverId, 
                },
            });
          
            
            setSelectedDriverData(response.data);
            console.log("Error Fix Here: --->" + selectedDriverData);
            console.log("Fetched DriverId Here:", response.data);
        } catch (error) {
            console.error("Fetched DriverId Here:", error);
        }
    };
    

    const fetchClientId = async () => {
    try {
        const response = await axios.get("http://localhost:8080/api/generate-client-id"); 
        setClientId(response.data.clientId); // Set clientId
        console.log("Fetched clientId:", response.data.clientId);
    } catch (error) {
        console.error("Error fetching clientId:", error);
    }
};

    const verifyCookie = async () => {
        try {
            const response = await axios.post("http://localhost:8080/Verify", null, {
                withCredentials: true 
            });
            console.log(response.data);
            setVerificationResult(response.data); 
        } catch (err) {
            console.error("Verification failed:", err);
            navigate("../ClientLogin");
            setVerificationResult(null);
        }
    };

    const getDrivers = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/get-all-drivers"); 
            console.log("Drivers:", response.data); 
    
            let nearestDriverId = null;  
            let shortestDistance = Infinity;  
    
            response.data.forEach((driver, index) => {
                const distance = calculateDistance(driver.latitude, driver.longitude, clientLatitude, clientLongitude);
                console.log(`Driver ${index + 1}:`, driver);
                console.log("Distance:", distance);
    
               
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestDriverId = driver.driverId;  
                }
            });
           
            if (nearestDriverId) {
                console.log("Nearest Driver ID:", nearestDriverId);
                console.log("Shortest Distance:", shortestDistance);
              
                getNearestDriver(nearestDriverId);
              } else {
                console.log("No nearest driver found.");
              }
            
    
        } catch (error) {
            console.error("Error fetching Drivers:", error);
        }
    };
    

    const geocodeDestination = async () => {
        setSearchRequest(true);
        if (!destinationInput) return;
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: destinationInput }, (results, status) => {
            if (status === "OK" && results[0].geometry) {
                const newDestination = {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                };
                setDestination(newDestination);
                SetCurrentDestination(newDestination);
                setTimeout(() => {
                    setSearchActive(true);
                  }, 2000);

                  SetCurrentDestination({
                    lat: selectedDriverData.latitude,
                    lng: selectedDriverData.longitude 
                });
                  
                console.log("New destination:", newDestination);
            } else {
                console.error("Geocode was not successful for the following reason:", status);
            }
        });
    };

    useEffect(() => {
       
        getCurrentLocation();
        verifyCookie(); 
        fetchClientId();
        getDrivers();
    }, []);

    return (
        <div className="ClientMapMainContainer">
            <div className="LocationFinderContainer">
                <img src={Logo} className="Car-Logo" alt="Logo" />
                <p>Please Enter Location Here</p>
                <textarea
                    className="LocationFinder-Text"
                    placeholder="Please Enter Location Here.."
                    rows="1"
                    cols="30"
                    style={{ resize: "none" }}
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                />
                
                <button onClick={geocodeDestination} className="Client-Search-Button">Search</button>

                <div className="Info">
                    <p>Distance: {distance}</p>
                    <p>Time: {duration}</p>
                </div>
                {SearchRequest ? (<>
                
                    {searchActive ? (
                    <div className="DriverDetails-Container">
                        <div className="Driver-Info">
                            <div className="Driver-Drive-Found">
                                <p>Driver Found..</p>
                            </div>
                            <div className="Driver-Meta-Account">
                                <p>Driver Meta-Account: {selectedDriverData.metaAccount}</p>
                            </div>
                        </div>
                        
                    </div>
                ) : (
                    <div>
                        <div className="SearchingRide"></div>
                    </div>
                )}
                        
                </>) : (
                    <>
                    
                    </>
                )}
                
            </div>
            <div style={{ height: "100vh", width: "100%" }}>
                <APIProvider apiKey="AIzaSyAMttRSkFiAkH6dnt5m840609PAiHHxy3o">
                    <Map mapId="e12abbf1c12be790" fullscreenControl={false}>
                        {currentPosition && (
                            <Directions 
                                origin={currentPosition} 
                                destination={currentDestination} 
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

    useEffect(() => {
        if (!routesLibrary || !map || typeof window.google === 'undefined') return;

        const service = new routesLibrary.DirectionsService();
        const renderer = new routesLibrary.DirectionsRenderer({ map, suppressMarkers: true });
        
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

               
                const route = result.routes[0];
                const leg = route.legs[0];
                const distance = leg.distance.text;
                const duration = leg.duration.text; 
                setDuration(duration);
                setDistance(distance);

              
                console.log(`Distance: ${distance}, Duration: ${duration}`);
            } else {
                console.error("Directions request failed due to " + status);
            }
        });
    }, [directionsService, directionsRenderer, origin, destination, setDistance, setDuration]);

    return (
        <>
            {origin && (
                <Marker
                    position={origin}
                    icon={{
                        url: Thumbnail,
                        scaledSize: new window.google.maps.Size(50, 30)
                    }}
                />
            )}
            {destination && (
                <Marker
                    position={destination}
                    icon={{
                        url: DestinationMarker,
                        scaledSize: new window.google.maps.Size(18, 23)
                    }}
                />
            )}
        </>
    );
}

export default ClientLocation;
