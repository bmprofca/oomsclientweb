import toast from 'react-hot-toast';

const API_BASE = "https://api.ooms.in/client";

/**
 * Unified API calling utility
 * @param {string} endpoint - The API endpoint or full URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object|null} body - Request payload
 * @returns {Promise<Response>} - The fetch response object
 */
export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const userDataStr = localStorage.getItem('ooms_user_data');
  let token = null;
  let username = null;
  let mobile = null;
  let countrycode = null;
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      token = userData.token;
      username = userData.username;
      mobile = userData.mobile;
      countrycode = userData.country_code;
    } catch (e) {
      console.error("Failed to parse ooms_user_data from local storage", e);
    }
  }

  const headers = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Send token as Authorization Bearer header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
  }

  if (username) {
    headers['username'] = username;
  }

  if (countrycode) {
    headers['countrycode'] = countrycode;
  }

  if (mobile) {
    headers['mobile'] = mobile;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  // Handle absolute vs relative URLs
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, options);

    // Global 401 Unauthorized handler
    if (response.status === 401) {
      localStorage.removeItem('ooms_user_data');

      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Try to show toast for messages
    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      
      if (data && data.message) {
        if (!response.ok || data.success === false) {
          toast.error(data.message);
        }
      }
    } catch (e) {
      // Ignored
    }

    return response;
  } catch (error) {
    console.error(`API Call Error (${url}):`, error);
    toast.error(error.message || "Network error or server unreachable");
    throw error;
  }
};


/**
 * Common file upload utility
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The URL of the uploaded file
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://upload.onesaas.in/api/upload', {
    method: 'POST',
    headers: {
      'key': 'onedevelopers'
    },
    body: formData
  });

  const result = await response.json();
  if (result.success && result.url) {
    return result.url;
  }
  throw new Error(result.message || 'Upload failed');
};

export default apiCall;