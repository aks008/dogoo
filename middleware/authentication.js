const jwt = require('jsonwebtoken');

exports.authenticateUser = (req, res, next) => {
  // Get token from either cookies or authorization header
  const token = req.cookies.token || req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

  // Check if the token is provided
  if (!token) {
    return res.redirect(process.env.BASE_PATH);
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // You can log the user details if needed
    // Check if the user role is "customer"
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: 'Access denied. Insufficient role permissions.' });
    }
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
