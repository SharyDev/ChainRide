import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import axios, { Axios } from "axios";
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
import ChainRideContract from "../Contracts/ChainRideContract.json";
import Web3 from 'web3';

function ClientLocation() {
    const navigate = useNavigate();
    const [initalData,setInitialData] = useState(true);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [destinationInput, setDestinationInput] = useState("");
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [SearchRequest, setSearchRequest] = useState("");
    const [driverId, setDriverId] = useState(null);
    const [clientId, setClientId] = useState(null);
    const [searchActive, setSearchActive] = useState(false);
    const [selectedDriverData,setSelectedDriverData] = useState(null);
    const [driverLocation,setDriverLocation] = useState(null);
    const [clientData, setClientData] = useState(null);
    const [driverData, setDriverData] = useState(null);
    const [holdDistance,setHoldDistance] = useState(null);
    const [location, setLocation ] = useState({});
    const [clientMetaAccount, setClientMetaAccount] = useState("");
    const [assigned,setAssigned] = useState(false);
    const [acceptRide,setAcceptRide] = useState(false);
    const [recieved, setRecieved] = useState(false);
    const [transactionCheck,settransactionCheck] = useState(false);
    const [destination, setDestination] = useState({
        lat: 43.6596,
        lng: -79.3960  
    });
    const [currentDestination,SetCurrentDestination] = useState({
        lat: 43.6596,
        lng: -79.3960  
    });
    const [clientLocationUpdates, setClientLocationUpdates] = useState(null);



    const fetchMetaAccount = async () => {
        if (window.ethereum) {
            try {
                // Request accounts from MetaMask
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setClientMetaAccount(accounts[0]); // Use the first account
            } catch (error) {
                console.error("Error fetching MetaMask account:", error);
                setError("MetaMask connection error");
            }
        } else {
            setError("MetaMask is not installed");
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
                    setLocation({
                        lat: latitude,
                        lng:longitude
                    })
                   
                    setClientLocationUpdates({
                        lat: latitude,
                        lng: longitude
                    })
                    console.log("Client's current location:", clientLocation);
    
                   
                    let ClientAcount = await fetchMetaAccount();
                    console.log("Client Accounts--->:", ClientAcount);
    
                   
                    
                },
                (err) => {
                    setError("Error: " + err.message);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    };

   
    const saveLocation = async () => {
        // Ensure clientId is fetched before sending the request
        
        if (!clientId  || !clientMetaAccount ) {
            console.error("Client ID or client MetaAccount is not available");
            return; // Don't proceed without a valid clientId
        }
        console.log("-----Working here--" + clientMetaAccount);
        
        if(clientData) return;
        if(initalData === false) return;
        try {
            await axios.post("http://localhost:8080/api/save-client-location", {
                clientId,
                latitude: clientLocationUpdates.lat,
                longitude: clientLocationUpdates.lng,
                ClientDestinationLatiture: destination.lat,
                ClientDestinationLongitude: destination.lng,
                metaAccount: clientMetaAccount
            });
            console.log("Location saved successfully.");
            setInitialData(false);
        } catch (err) {
            console.error("Failed to save location:", err);
        }
    };

    

    useEffect(() => {
        

       
            saveLocation();
        
    }, [clientLocationUpdates, destination]);
 
    const fetchClientId = async () => {
        try {
          const response = await axios.get("http://localhost:8080/api/generate-client-id");
          
          // Log the entire response data for debugging
          console.log("Fetched response data:", response.data);
  
          // Set clientId from the response
          if (response.data && response.data.clientId) {
            setClientId(response.data.clientId);
           
          } else {
            console.error("clientId not found in the response:", response.data);
          }
        } catch (error) {
          console.error("Error fetching clientId:", error);
        }
      };
  
    
    useEffect(() => {
      // If clientId is already set, do not call the API again
      if (clientId !== null) return;
  
     
      fetchClientId(); // Call fetchClientId only once
      
      getDrivers();
    }, [clientId]);

   

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
 
///////////////////////////////
    const getDrivers = async () => {
        console.log(clientId);
        // Only fetch client data if clientId is not null
        if (clientId) {
            try {
                const response = await axios.get(`http://localhost:8080/api/get-client?clientId=${clientId}`);
                console.log("Client data:", response.data); 
                

            } catch (error) {
                console.error("Error fetching client:", error);
            }
        } else {
            console.log("clientId is null, not fetching client data.");
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
    
                // Set new destination
                setDestination(newDestination);
    
                // If a driver is selected, set the current destination to the driver's location
                if (selectedDriverData) {
                    SetCurrentDestination({
                        lat: selectedDriverData.latitude,
                        lng: selectedDriverData.longitude
                    });
                } else {
                    // Set the destination location if no driver is selected
                    SetCurrentDestination(newDestination);
                }
               
                
                DriverSelected();
                // Activate search after a short delay
                
    
                console.log("New destination:", newDestination);
            } else {
                console.error("Geocode was not successful for the following reason:", status);
            }
        });
    };
    let n=0;
    const DriverSelected = async () => {
        console.log("Search Req:", SearchRequest);
    
        if (SearchRequest) {
            if (!clientId) {
                console.error("clientId is missing");
                return;
            }
    
            try {
                const response = await axios.get(`http://localhost:8080/api/get-client?clientId=${clientId}`);
                console.log("Client data 2:", response.data);
    
                if (response.data.clientPicked) {
                    SetCurrentDestination({
                        lat: response.data.ClientDestinationLatiture,
                        lng: response.data.ClientDestinationLongitude,
                    });
                }
    
                if (response.data.driverId) {
                    console.log("Working on getting driver ID.");
                    getDriverInfo(response.data.driverId);
                }
                let RideComplionDistance;
                
                if (response.data.rideComplete && n === 0) {
                    if (!response.data.paymentComplete) {
                        if (clientData && driverData) {
                            RideComplionDistance = calculateDistance(
                                response.data.latitude,
                                response.data.longitude,
                                response.data.ClientDestinationLatiture,
                                response.data.ClientDestinationLongitude
                            );
    
                            RideComplionDistance += calculateDistance(
                                response.data.latitude,
                                response.data.longitude,
                                driverData.latitude,
                                driverData.longitude
                            );
    
                            console.log("Ride Completion Distance:", RideComplionDistance);
                        }
    
                            let Res = response.data;
                            console.log("Initiating metaTransaction...");
                           

                            settransactionCheck(true);
                            console.log("Working here");
                            if (window.ethereum) {
                    
                                const contractAddress = "0x178f2b8C24334DCF8E95aC73735b24A2A7B82A8B";
                                const abi = ChainRideContract.abi;
                                const web3 = new Web3(window.ethereum);
                               
                                const price =  0.00000754;
                                const priceInWei = web3.utils.toWei(String(price), 'ether');  // Assuming the price is stored in clientData
                                const distance = parseInt("12");
                                const initialLongitude = parseInt(currentPosition.lng);  // Scaling for better precision
                                const initialLatitude = parseInt(currentPosition.lat);
                                const finalLongitude = parseInt(Res.ClientDestinationLongitude);
                                const finalLatitude = parseInt(Res.ClientDestinationLatiture);
                    
                    
                                console.log("Bug");
                    
                    
                                const clientMetaAccount = "0x0AbEd4042cDBB24614d150F459Cb769D1F3EB8cb";  // Assuming client's address is stored in clientData
                                const driverMetaAccount = "0x178f2b8C24334DCF8E95aC73735b24A2A7B82A8B";  // Assuming driver's address is available
                               
                                
                                window.ethereum.enable();  
                                const contract = new web3.eth.Contract(abi, contractAddress);
                                
                               await web3.eth.getAccounts().then(accounts => {
                                    const signer = accounts[0]; 
                                    n++;
                                    contract.methods
                                        .recordTrip(
                                            priceInWei,
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
                                            value: web3.utils.toWei(0.00000756, 'ether'),  
                                            gas: 2000000  
                                            
                                        })
                                        .on('transactionHash', (hash) => {
                                          
                                            console.log(`Transaction hash: ${hash}`);
                                            
                                        })
                                        .on('receipt', (receipt) => {
                                            console.log('Transaction receipt:', receipt);
                                          
                                            
                                                try {
                                                     axios.post("http://localhost:8080/api/client-payment", { id: clientData.clientId });
                                                    console.log("Payment recorded successfully.");
                    
                                                    
                    
                                                    setSearchActive(false);
                                                } catch (err) {
                                                    if (err.response) {
                                                        console.error("Error response from server:", err.response.data);
                                                    } else {
                                                        console.error("Error making request:", err.message);
                                                    }
                                                }
                                                
                                            }
                                        )
                                        .on('error', (error) => {
                                            console.error('Error recording trip:', error);
                                        });
                                }).catch(error => {
                                    console.error('Error getting accounts:', error);
                                });
                            } else {
                                console.log('Ethereum provider not found. Please install MetaMask or another Ethereum wallet.');
                            }
                           
                        
                    }
                }
    
                if (response.data.assigned) {
                    setTimeout(() => {
                        setSearchActive(true);
                    }, 2000);
                    setAssigned(true);
                    setClientData(response.data);
                } else {
                    console.log("Client not assigned or no assigned property found.");
                }
            } catch (error) {
                console.error("Error fetching client data:", error.message);
            }
        }
    };
    
    
    const metaTransaction = async (RideDistance , Res) =>
    {
        
    }

    useEffect(() => {
        if (driverId) { 
            console.log("Driver ID has been updated:", driverId);
            // Add additional logic here if needed
        }
    }, [driverId]);

    const getDriverInfo = async (driverid) => {
        try {
            console.log("DriverId" + driverid);
            const response = await axios.get(`http://localhost:8080/api/get-driver?driverId=${driverid}`);
            console.log("Driver:", response.data);
            setDriverData(response.data); 
            
        } catch (error) {
            console.error("Error fetching driver data:", error);
        }
    }
    useEffect(() => {
        if (driverData) {
            console.log("Driver Data Updated:", driverData);
        } else {
            console.log("Driver Data is null or not yet updated.");
        }
    }, [driverData]); 

    const RideAccepted = () => {
        setAcceptRide(true);

        console.log(" LAT: " + driverData.latitude + "longitude" + driverData.longitude);
        if(clientData.assigned === true)
        {
            SetCurrentDestination({
                lat: driverData.latitude,
                lng: driverData.longitude
            });
        }

       
    }

    
    useEffect(() => {
        // Set the interval to call DriverSelected every 5 seconds (5000ms)
        const intervalId2 = setInterval(() => {
        
            DriverSelected();
            
        }, 5000); // Adjust the time interval as needed

        // Cleanup the interval when the component unmounts
        return () => clearInterval(intervalId2);
    }, [SearchRequest, clientId]);
    
    

    useEffect(() => {
        getDrivers();
        getCurrentLocation();
        verifyCookie(); 
        
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
                                <p className="Client-Info-Container">Driver ID: {clientData.driverId}</p>
                                <p className="Client-DriverMetaAcccount">Driver Meta-Account: {clientData.metaAccount}</p>
                                <p className="Client-Info-Container">Cost: {clientData.cost}</p>
                                {acceptRide ? (
                                    <>
                                        {recieved ? (
                                            <>
                                              
                                            </>
                                        ) : (
                                            <>
                                                <div className="Moving-RideContainer">
                                                    <div className="MovingRide"></div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button className="Client-AcceptRide" onClick={RideAccepted}>Accept</button>
                                    </>
                                )}
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
    }, [destination, directionsService, directionsRenderer, origin, destination, setDistance, setDuration]);

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
