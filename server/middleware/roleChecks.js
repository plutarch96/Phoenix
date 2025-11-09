// Additional role-based middleware for fine-grained access control

// Check if user can manage projects (Project Manager or Admin)
const requireProjectManager = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'project_manager')) {
    return res.status(403).json({ error: 'Access denied. Project Manager or Admin access required.' });
  }
  next();
};

// Check if user can manage calibrations (Staff, Project Manager, or Admin)
const requireStaffOrAbove = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'project_manager' && req.user.role !== 'staff' && req.user.role !== 'employee')) {
    return res.status(403).json({ error: 'Access denied. Staff access or above required.' });
  }
  next();
};

module.exports = {
  requireProjectManager,
  requireStaffOrAbove
};
