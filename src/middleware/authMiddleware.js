const { supabase } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header is required'
      });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Bearer token is required'
      });
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('Auth verification error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata
    };
    req.headers['user-id'] = user.id;
    
    console.log(`Authenticated user: ${user.id} (${user.email})`);
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          req.user = {
            id: user.id,
            email: user.email,
            ...user.user_metadata
          };
          req.headers['user-id'] = user.id;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
