const { supabase } = require('../config/database');

class AuthService {
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Account created successfully',
      user: data.user,
      session: data.session
    };
  }

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Signed in successfully',
      user: data.user,
      session: data.session
    };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Signed out successfully'
    };
  }
}

module.exports = new AuthService();