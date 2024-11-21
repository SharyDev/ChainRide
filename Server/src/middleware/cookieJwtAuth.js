const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    // Extract token from cookies
    const token = req.cookies.token;

    // Check if the token is provided
    if (!token) {
        return res.status(403).json({ message: "No token provided." });
    }

    try {
        console.log(req.user);
        // Verify the token using your secret
        const user = jwt.verify(token, "Hello"); // Replace "Hello" with your actual secret
        req.user = user; // Attach the user information to the request object
        next(); // Call the next middleware or route handler
    } catch (err) {
        console.error(err); // Log the error for debugging

        return res.redirect("/"); // Respond with unauthorized status
    }
};
