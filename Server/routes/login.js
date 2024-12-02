const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
    const username = "Chain";

  
    const token = jwt.sign({ username }, "ChainRide", { expiresIn: "1h" });

   
    res.cookie("token", token, {
        httpOnly: true,
    });

   
    return res.status(200).json({ message: "Login successful" }); 
};
