require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
};