const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const validatePassword = (password) => {
    return password && password.length >= 6;
  };
  
  const validateAuthInput = (req, res, next) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
  
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address'
      });
    }
  
    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }
  
    next();
  };
  
  module.exports = {
    validateAuthInput,
    validateEmail,
    validatePassword
  };