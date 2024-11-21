const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require('mongoose');
const path = require("path");
const loginRoute = require("../Server/routes/login");
const verifiedRoute = require("../Server/routes/Verified");
const cookieJwtAuth = require("./src/middleware/cookieJwtAuth");

const app = express();
const passwordMongo = "Hola123";
const DB_Path = `mongodb+srv://shahroz2019:${passwordMongo}@cluster0.jvh0h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const Port = 8080;

// Define schemas for client and driver locations, including counter schema for client and driver IDs
const clientLocationSchema = new mongoose.Schema({
    clientId: { type: Number, unique: true }, 
    latitude: Number,
    longitude: Number,
    ClientDestinationLatiture: Number,
    ClientDestinationLongitude: Number,
    metaAccount: { type: String, required: true }, 
    assigned: { type: Boolean, default: false } 
});


const driverLocationSchema = new mongoose.Schema({
    driverId: { type: Number, unique: true }, 
    latitude: Number,
    longitude: Number,
    metaAccount: { type: String, required: true } 
});

const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

// Define models for client locations, driver locations, and counters
const ClientLocation = mongoose.model('ClientLocation', clientLocationSchema);
const DriverLocation = mongoose.model('DriverLocation', driverLocationSchema);
const Counter = mongoose.model("Counter", counterSchema);

// Connect to MongoDB database
mongoose.connect(DB_Path, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Middleware setup
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Function to get the next available driverId
async function getNextDriverId() {
    const counter = await Counter.findOneAndUpdate(
        { name: "driverId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}

// Function to get the next available clientId
async function getNextClientId() {
    const counter = await Counter.findOneAndUpdate(
        { name: "clientId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}

// Route to save Client Location with auto-incremented clientId
app.post('/api/save-client-location', async (req, res) => {
    const { clientId, latitude, longitude, ClientDestinationLatiture, ClientDestinationLongitude, metaAccount } = req.body;
    
    // Ensure that the metaAccount is present
    if (!metaAccount) {
        return res.status(400).json({ error: "metaAccount is required" });
    }
    
    try {
        const CLocation = new ClientLocation({
            clientId,
            latitude,
            longitude,
            ClientDestinationLatiture,
            ClientDestinationLongitude,
            metaAccount,
            assigned: false
        });

        await CLocation.save();
        res.status(200).json({ message: "Location saved successfully." });
    } catch (error) {
        console.error("Error saving location:", error);
        res.status(500).json({ error: "Failed to save location" });
    }
});

// Route to save Driver Location with auto-incremented driverId
app.post('/api/save-driver-location', async (req, res) => {
    const { latitude, longitude, driverId, metaAccount } = req.body;

    if (!metaAccount) {
        return res.status(400).json({ error: "metaAccount is required" });
    }

    try {
        let id = driverId;

        // Generate a new driverId if not provided
        if (!id) {
            id = await getNextDriverId();
        }

        // Find and update the location, or create it if it doesn’t exist
        const location = await DriverLocation.findOneAndUpdate(
            { driverId: id },
            { latitude, longitude, metaAccount },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: "Driver location updated successfully", location });
    } catch (error) {
        res.status(500).json({ message: "Error updating driver location", error });
    }
});

// Endpoint to generate a new driverId
app.get('/api/generate-driver-id', async (req, res) => {
    try {
        const driverId = await getNextDriverId();
        res.json({ driverId });
    } catch (error) {
        res.status(500).json({ message: "Error generating driver ID", error });
    }
});

// Endpoint to generate a new clientId
app.get('/api/generate-client-id', async (req, res) => {
    try {
        const clientId = await getNextClientId();
        console.log(clientId);
        res.json({ clientId });
    } catch (error) {
        res.status(500).json({ message: "Error generating client ID", error });
    }
});

app.get('/api/get-all-drivers', async (req, res) => {
    try {
        const drivers = await DriverLocation.find(); // Fetch all driver records
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: "Error getting Drivers", error });
    }
});

app.get('/api/nearest-driver', async (req, res) => {
    try {
        const { driverId } = req.query;  // Update to `driverId`
        
        if (!driverId) {
            return res.status(400).json({ message: "Driver ID is required" });
        }

        const driver = await DriverLocation.findOne({ driverId: driverId }); // Use `driverId` instead of `driverId2`

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.status(200).json(driver); // Return the found driver
    } catch (error) {
        res.status(500).json({ message: "Error getting driver", error });
    }
});

app.get('/api/Get-All-Clients', async (req, res) => {
    try {
        const allClients = await ClientLocation.find(); 
        res.status(200).json(allClients); 
    } catch (error) {
        console.error("Error fetching all clients:", error);
        res.status(500).json({ message: "Error fetching clients", error });
    }
});


// Auth routes
app.post("/login", loginRoute);
app.post("/Verify", cookieJwtAuth, verifiedRoute);

// Start the server
app.listen(Port, () => {
    console.log(`Server is running on http://localhost:${Port}`);
});
