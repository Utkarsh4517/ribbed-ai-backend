class HealthController {
    async getHealth(req, res) {
      res.json({ 
        status: 'OK', 
        message: 'Ribbed AI Backend is running',
        timestamp: new Date().toISOString(),
        sdk: 'replicate with google/gemini-2.5-flash-image'
      });
    }
  }
  
  module.exports = new HealthController();