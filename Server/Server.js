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

const Port = 8080;

const clientLocationSchema = new mongoose.Schema({
    clientId: { type: Number, unique: true }, 
    latitude: Number,
    longitude: Number,
    ClientDestinationLatiture: Number,
    ClientDestinationLongitude: Number,
    metaAccount: { type: String, required: true }, 
    assigned: { type: Boolean, default: false },
    driverId: { type: Number, default: 0 }, 
    clientPicked: { type: Boolean, default: false }, 
    rideComplete: { type: Boolean, default: false }, 
    cost: { type: Number, default: 0.0 }, 
    paymentComplete: { type: Boolean, default: false }
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

const DB_Path = `mongodb+srv://shahroz2019:${passwordMongo}@cluster0.jvh0h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const ClientLocation = mongoose.model('ClientLocation', clientLocationSchema);
const DriverLocation = mongoose.model('DriverLocation', driverLocationSchema);
const Counter = mongoose.model("Counter", counterSchema);


mongoose.connect(DB_Path, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


async function getNextDriverId() {
    const counter = await Counter.findOneAndUpdate(
        { name: "driverId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}


async function getNextClientId() {
    const counter = await Counter.findOneAndUpdate(
        { name: "clientId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}


app.post('/api/save-client-location', async (req, res) => {
    const { clientId, latitude, longitude, ClientDestinationLatiture, ClientDestinationLongitude, metaAccount } = req.body;
    
  
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
            assigned: false,
            driverId: 0, 
            clientPicked: false, 
            rideComplete: false, 
            cost: 0.0 
        });

        await CLocation.save();
        res.status(200).json({ message: "Location saved successfully." });
    } catch (error) {
        console.error("Error saving location:", error);
        res.status(500).json({ error: "Failed to save location" });
    }
});


app.post('/api/save-driver-location', async (req, res) => {
    const { latitude, longitude, driverId, metaAccount } = req.body;

    if (!metaAccount) {
        return res.status(400).json({ error: "metaAccount is required" });
    }

    try {
        let id = driverId;

       
        if (!id) {
            id = await getNextDriverId();
        }

        
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


app.get('/api/generate-driver-id', async (req, res) => {
    try {
        const driverId = await getNextDriverId();
        res.json({ driverId });
    } catch (error) {
        res.status(500).json({ message: "Error generating driver ID", error });
    }
});


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
        const drivers = await DriverLocation.find(); 
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: "Error getting Drivers", error });
    }
});

app.get('/api/nearest-driver', async (req, res) => {
    try {
        const { driverId } = req.query;  
        
        if (!driverId) {
            return res.status(400).json({ message: "Driver ID is required" });
        }

        const driver = await DriverLocation.findOne({ driverId: driverId }); 

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.status(200).json(driver);
    } catch (error) {
        res.status(500).json({ message: "Error getting driver", error });
    }
});


app.post('/api/set-DriverID', async (req, res) => {
    const { id, driverId, cost } = req.body;

    
    if (!id || !driverId) {
        return res.status(400).json({ message: "Client ID and Driver ID are required." });
    }

    try {
        const client = await ClientLocation.findOne({ clientId: id });
        
        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }

  
        client.driverId = driverId;
        await client.save();

        res.status(200).json({ message: "Driver ID assigned successfully.", updatedClient: client });
    } catch (error) {
        console.error("Error updating driver ID:", error);
        res.status(500).json({ message: "Error updating driver ID", error });
    }
});

app.post('/api/set-Received', async (req, res) => {
    const { id } = req.body;

    
    if (!id) {
        return res.status(400).json({ message: "Client ID is required." });
    }

    try {
        const client = await ClientLocation.findOne({ clientId: id });
        
        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }

        
        client.clientPicked = true;
        await client.save();

    } catch (error) {
        res.status(500).json({ message: "Error updating..", error });
    }
});

app.post('/api/driver-Accept', async (req, res) => {
    const { id, driverId,costR } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Client ID is required." });
    }

    try {
        const client = await ClientLocation.findOne({ clientId: id });
        
        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }

        
        client.assigned = true;
        client.driverId = driverId;
        client.cost = costR;
        await client.save();

    } catch (error) {
        res.status(500).json({ message: "Error updating..", error });
    }
});




app.get('/api/Get-All-Clients', async (req, res) => {
    try {
       
        const allClients = await ClientLocation.find({ assigned: false }); 

      
        res.status(200).json(allClients); 
    } catch (error) {
        console.error("Error fetching all clients:", error);
        res.status(500).json({ message: "Error fetching clients", error });
    }
});


app.get('/api/get-client', async (req, res) => {
    const { clientId } = req.query;  
    
    if (!clientId) {
        return res.status(400).json({ message: "clientId is required" });
    }

    try {
        const client = await ClientLocation.findOne({ clientId }).maxTimeMS(5000);

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        res.status(200).json(client); 
    } catch (error) {
        console.error("Error fetching client:", error);
        res.status(500).json({ message: "Error fetching client", error });
    }
});

app.get('/api/get-driver', async (req, res) => {
    const { driverId } = req.query;   

    if (!driverId) {
        return res.status(400).json({ message: "driverId is required" });
    }

    try {
        const driver = await DriverLocation.findOne({ driverId: driverId }); 

        if (!driver) {  
            return res.status(404).json({ message: "driver not found" });
        }

        res.status(200).json(driver);
    } catch (error) {
        console.error("Error fetching driver:", error);
        res.status(500).json({ message: "Error fetching driver", error });
    }
});




app.post('/api/client-payment', async (req, res) => {
    const { id } = req.body;

  
    if (!id) {
        return res.status(400).json({ message: "Client ID is required." });
    }

    try {
        const client = await ClientLocation.findOne({ clientId: id });
        
        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }

       
        client.paymentComplete = true;
        await client.save();

    } catch (error) {
        res.status(500).json({ message: "Error updating..", error });
    }
});

app.post("/api/set-Cost", async (req,res) => {
    const {id , cost } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Client ID is required." });
    }

    try {
        const client = await ClientLocation.findOne({ clientId: id });
        
        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }

       
        client.cost = cost;
        await client.save();
    } catch (error) {
        res.status(500).json({ message: "Error updating..", error });
    }

})


app.post('/api/set-RideComplete', async (req, res) => {
    const { id } = req.body;

    
    if (!id) {
        return res.status(400).json({ message: "Client ID is required." });
    }

    try {
        const client = await ClientLocation.findOne({ clientId: id });
        
        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }

        
        client.rideComplete = true;
        await client.save();

    } catch (error) {
        res.status(500).json({ message: "Error updating..", error });
    }
});




// Auth routes
app.post("/login", loginRoute);
app.post("/Verify", cookieJwtAuth, verifiedRoute);


app.listen(Port, () => {
    console.log(`Server is running on http://localhost:${Port}`);
});
