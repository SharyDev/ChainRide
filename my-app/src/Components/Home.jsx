import React, { useEffect, useRef } from "react";
import Header from "./Header";
import "../Styles/Home.css";
import { IoIosArrowDown } from 'react-icons/io';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import GlobeImg from "../Assets/Images/Globe4.jpg";
import CarImage from "../Assets/Images/Background.png";
import { redirect, useHref, useNavigate } from "react-router-dom";
import CarService from "../Assets/Images/Car-Service.png";
import blockchainTransaction from "../Assets/Images/Blockchain-Transaction.png";
import drivingLogo from "../Assets/Images/Driving.png";


function Home() {
    const globeContainerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Set up scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, globeContainerRef.current.offsetWidth / globeContainerRef.current.offsetHeight, 0.1, 1000);
        camera.position.z = 400;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(globeContainerRef.current.offsetWidth, globeContainerRef.current.offsetHeight);
        globeContainerRef.current.appendChild(renderer.domElement);

        // Create and configure the globe with texture
        const globe = new ThreeGlobe()
            .globeImageUrl(GlobeImg); 

        // arc data 
        const arcsData = [
            { startLat: 37.7749, startLng: -122.4194, endLat: 40.7128, endLng: -74.0060, color: "#FF0000" }, // San Francisco to New York
            { startLat: 34.0522, startLng: -118.2437, endLat: 51.5074, endLng: -0.1278, color: "#00FF00" }, // Los Angeles to London
            { startLat: 35.6895, startLng: 139.6917, endLat: -33.8688, endLng: 151.2093, color: "#0000FF" }  // Tokyo to Sydney
        ];

        // Add arcs to globe
        globe
            .arcsData(arcsData)
            .arcColor('color')
            .arcAltitudeAutoScale(0.5)
            .arcStroke(0.5)
            .arcDashLength(0.5)
            .arcDashGap(4)
            .arcDashAnimateTime(2000); 

        scene.add(globe);

        // Add ambient and directional light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            globe.rotation.y += 0.001; 
            renderer.render(scene, camera);
        };
        animate();

        
        // Handle window resize
        const handleResize = () => {
            camera.aspect = globeContainerRef.current.offsetWidth / globeContainerRef.current.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(globeContainerRef.current.offsetWidth, globeContainerRef.current.offsetHeight);
        };

        window.addEventListener('resize', handleResize);

        // Clean up on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            globeContainerRef.current.removeChild(renderer.domElement);
        };
    }, []);
    
            const services = [
                {
                    title: "Ride Booking",
                    description: "Connect riders and drivers directly with blockchain-powered ride matching. Enjoy real-time tracking, fare transparency, and seamless booking without intermediaries.",
                    icon: "🚗", // Replace with a relevant icon or SVG
                },
                {
                    title: "Enhanced Safety Features",
                    description: "Stay safe with blockchain-enabled emergency alerts, anonymized profiles, and secure rider-driver pairing using cryptographic QR codes.",
                    icon: "🛡️", // Replace with a relevant icon or SVG
                },
                {
                    title: "Secure Payments",
                    description: "Pay with cryptocurrencies or fiat-to-crypto gateways. Payments are held in smart contract escrow and released only after the ride is completed.",
                    icon: "💳", // Replace with a relevant icon or SVG
                },
                {
                    title: "Eco-Friendly Rides",
                    description: "Choose eco-friendly rides with green vehicle options and shared rides. Contribute to carbon offset programs for a sustainable future.",
                    icon: "🌱", // Replace with a relevant icon or SVG
                },
            ];


    return (
        <>
            <Header />
            <div className="HomeMainComponent">
                <div className="HomeInnerComponent">
                    <div className="Home-Intro">
                        <p>Ride when you want, <span className="Home-SpamText">where you want.</span><br /><span>Powered by Decentralized Crypto Technology</span></p>
                        <a className="Home-RideButton" href="/ClientLogin">Book a Ride</a>
                    </div>
                    <div className="HomeImage">
                        <img src={CarImage} className="HomeCar-Image" ></img>
                    </div>
                </div>
                <div className="Home-Symbol">
                    <IoIosArrowDown className="Down-Arrow-1" />
                    <IoIosArrowDown className="Down-Arrow-2" />
                </div>
                <div className="Part2MainContainer">
                   <h1>About Us</h1>
                   <div className="Part2-Para-Container">
                        <p className="Part2-Para">Chain Ride is a decentralized, blockchain-based ride-booking platform designed to give riders and drivers control, transparency, and security in every journey. Powered by decentralized technology, BlockRide is a decentralized, blockchain-based ride-booking platform designed to give riders and drivers control, transparency, and security in every journey. Powered by decentralized technology, BlockRide connects riders directly with drivers without relying on traditional intermediaries, reducing costs and ensuring fair compensation for drivers connects riders directly with drivers without relying on traditional intermediaries, reducing costs and ensuring fair compensation for drivers.</p>
                   </div>
                   <div className="Globe-Container" ref={globeContainerRef} style={{ width: '100%', height: '500px' }}></div>
                </div>
                <div className="Part3ServicesContainer">
                    <h2 className>Our Services</h2>
                    <div className="ServicesContainer">
                        
                            <div className="Car-Serivce">
                                <img className="Car-Serivce-img"src={CarService}></img>
                                <p  className="Car-Serivce-text">Car Booking</p>
                            </div>
                            <div className="Car-Serivce">
                                <img className="Car-Serivce-img"src={blockchainTransaction}></img>
                                <p  className="Car-Serivce-text">Blockchain</p>
                            </div>
                            <div className="Car-Serivce">
                                <img className="Car-Serivce-img"src={drivingLogo}></img>
                                <p  className="Car-Serivce-text">Driving</p>
                            </div>
                        
                    </div>
                    <div className="Part4ContactContainer">
                                
                    </div>
                </div>
            </div>
        </>
    );
}

export default Home;
