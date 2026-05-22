// API Configuration
// In production with Vercel Services, the backend is at /api
// In development, it may be a separate server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('admin_token');
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    console.error('API Error:', error);
    
    // If unauthorized, clear token and prompt re-login
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_authenticated');
      
      // Redirect to login if on admin page
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin';
      }
    }
    
    throw new Error(error.error || error.message || 'Something went wrong');
  }
  return response.json();
};

// ============================================================================
// PORTFOLIO API
// ============================================================================

export const portfolioAPI = {
  // Get all portfolio data
  getPortfolio: async () => {
    const response = await fetch(`${API_BASE_URL}/portfolio`);
    return handleResponse(response);
  },

  // Update entire portfolio
  updatePortfolio: async (data) => {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Update specific section
  updateSection: async (section, data) => {
    const response = await fetch(`${API_BASE_URL}/portfolio/section/${section}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  // Login
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(response);
    
    // Store token in localStorage (FastAPI returns access_token)
    if (data.access_token) {
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Register
  register: async (username, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    const data = await handleResponse(response);
    
    // Store token in localStorage (FastAPI returns access_token)
    if (data.access_token) {
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return handleResponse(response);
  },

  // Logout
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_authenticated');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  }
};

// ============================================================================
// CONTACT API
// ============================================================================

export const contactAPI = {
  // Submit contact form
  submitMessage: async (data) => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Get all messages (admin only)
  getMessages: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/contact?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return handleResponse(response);
  },

  // Get single message
  getMessage: async (id) => {
    const response = await fetch(`${API_BASE_URL}/contact/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return handleResponse(response);
  },

  // Mark as read/unread
  markAsRead: async (id, read = true) => {
    const response = await fetch(`${API_BASE_URL}/contact/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ read })
    });
    return handleResponse(response);
  },

  // Add reply
  addReply: async (id, replyMessage) => {
    const response = await fetch(`${API_BASE_URL}/contact/${id}/reply`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ reply: replyMessage })
    });
    return handleResponse(response);
  },

  // Delete message
  deleteMessage: async (id) => {
    const response = await fetch(`${API_BASE_URL}/contact/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return handleResponse(response);
  },

  // Delete multiple messages
  deleteMessages: async (ids) => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ ids })
    });
    return handleResponse(response);
  }
};

// ============================================================================
// UPLOAD API
// ============================================================================

export const uploadAPI = {
  // Upload file
  uploadFile: async (file, type = 'image') => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      
      // If unauthorized, clear token and prompt re-login
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_authenticated');
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(error.message || 'Upload failed');
    }
    
    return response.json();
  },

  // Delete file
  deleteFile: async (type, filename) => {
    const response = await fetch(`${API_BASE_URL}/upload/${type}/${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return handleResponse(response);
  }
};

export default {
  portfolio: portfolioAPI,
  auth: authAPI,
  contact: contactAPI,
  upload: uploadAPI
};
