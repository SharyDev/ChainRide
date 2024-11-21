import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Components/Home";
import ClientLogin from "./Components/ClientLogin";
import DriverLogin from './Components/DriverLogin';
import ClientMap from "./Components/ClientLocation";
import DriverMap from "./Components/DriverMap";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
            <Routes>
                <Route path="/Home" element={<Home></Home>} />
                <Route path="/DriverLogin" element={<DriverLogin />} />
                <Route path="/ClientLogin" element={<ClientLogin />} />
                <Route path="/DriverMaps" element={<DriverMap></DriverMap>} />
                <Route path="/ClientMaps" element={<ClientMap></ClientMap>} />
            </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
