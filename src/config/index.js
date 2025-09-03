require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
  FAL_KEY: process.env.FAL_KEY,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
};