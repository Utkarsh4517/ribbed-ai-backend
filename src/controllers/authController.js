const authService = require('../services/authService');

class AuthController {
  async signUp(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.signUp(email, password);
      res.json(result);

    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ 
        error: 'Failed to create account',
        message: error.message 
      });
    }
  }

  async signIn(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.signIn(email, password);
      res.json(result);

    } catch (error) {
      console.error('Signin error:', error);
      res.status(400).json({ 
        error: 'Failed to sign in',
        message: error.message 
      });
    }
  }

  async signOut(req, res) {
    try {
      const result = await authService.signOut();
      res.json(result);

    } catch (error) {
      console.error('Signout error:', error);
      res.status(400).json({ 
        error: 'Failed to sign out',
        message: error.message 
      });
    }
  }
}

module.exports = new AuthController();