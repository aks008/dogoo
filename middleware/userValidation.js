const jwt = require('jsonwebtoken');
exports.renderUser = (req, res, renderPath) => {
  const token = req.cookies.token || req.headers['authorization'] && req.headers['authorization'];
  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return res.render(renderPath, {
      layout: 'dashboard',  // Use the dashboard layout
      isAuthenticated: true,
      user: req.user,  // Pass user data to the view
      title: 'Dashboard'  // Title for the page,
	});
  } else {
	   return res.render(renderPath)
  }
}
