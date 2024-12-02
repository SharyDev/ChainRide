const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    
    const token = req.cookies.token;

    
    if (!token) {
        return res.status(403).json({ message: "No token provided." });
    }

    try {
        console.log(req.user);
        
        const user = jwt.verify(token, "ChainRide");
        req.user = user; 
        next();
    } catch (err) {
        console.error(err); 

        return res.redirect("/"); 
    }
};
