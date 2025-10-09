import axiosInstance from './axiosInstance';
import axios from 'axios';

/**
 * Handles user login with email and password.
 * Endpoint: POST /users/signin/
 */
export async function loginUser(email, password) {
  try {
    // --- UPDATED ENDPOINT TO /users/signin/ ---
    const response = await axiosInstance.post(`/users/signin/`, { email, password });
    return response.data; // Expected: { access, refresh, user: {id, email, role, ...} }
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Handles user sign up/registration with all required fields.
 * Endpoint: POST /users/signup/
 * Required API fields: first_name, last_name, email, password, role
 */
export async function signupUser(formData) {
  try {
    // --- TEST POST SIGNUP ENDPOINT ---
    const response = await axiosInstance.post(`/users/signup/`, formData);
    // The backend is expected to return the user data or a success status
    return response.data; 
  } catch (error) {
    console.error('Signup failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetches the user's profile and current role. Used after token verification.
 * Endpoint: GET /users/profile/
 */
export async function fetchUserProfile() {
  try {
    const response = await axiosInstance.get(`/users/profile/`);
    return response.data; // Expected: { id, email, role, first_name, ... }
  } catch (error) {
    console.error('Failed to fetch user profile:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Refreshes the access token using the refresh token.
 * Endpoint: POST /users/token/refresh/
 */
export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Create a new axios instance without interceptors to avoid infinite loops
    const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/users/token/refresh/`, {
      refresh: refreshToken
    });
    
    return response.data; // Expected: { access: "new_access_token" }
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    throw error;
  }
}
export async function completeOnboarding(role, schoolCode, extraDetails) {
  try {
    const response = await axiosInstance.post(`/users/auth/onboarding/`, { 
      role, 
      school_code: schoolCode, 
      ...extraDetails 
    });
    return response.data; // Expected: Updated user object with new role
  } catch (error) {
    console.error('Onboarding failed:', error.response?.data || error.message);
    throw error;
  }
}
