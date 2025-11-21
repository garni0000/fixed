import axios from 'axios';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import pronosMock from '@/mocks/pronos.json';
import userMock from '@/mocks/user.json';

const API_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK = !API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor
api.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting Firebase token:', error);
  }
  return config;
});

// Mock API functions
export const mockApi = {
  getPronos: (date?: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = pronosMock;
        if (date) {
          filtered = pronosMock.filter(p => p.date === date);
        }
        resolve({ data: filtered });
      }, 500);
    });
  },
  
  getPronoById: (id: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const prono = pronosMock.find(p => p.id === id);
        if (prono) {
          resolve({ data: prono });
        } else {
          reject(new Error('Prono not found'));
        }
      }, 300);
    });
  },
  
  getUser: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: userMock });
      }, 400);
    });
  },
  
  login: (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          resolve({ 
            data: { 
              token: 'mock_token_123',
              user: userMock 
            } 
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  },
  
  register: (email: string, password: string, firstName: string, lastName: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            token: 'mock_token_new',
            user: { ...userMock, email, firstName, lastName } 
          } 
        });
      }, 800);
    });
  }
};

// API service functions
export const authService = {
  login: async (email: string, password: string) => {
    if (USE_MOCK) {
      return mockApi.login(email, password);
    }
    return api.post('/auth/login', { email, password });
  },
  
  register: async (email: string, password: string, firstName: string, lastName: string) => {
    if (USE_MOCK) {
      return mockApi.register(email, password, firstName, lastName);
    }
    return api.post('/auth/register', { email, password, firstName, lastName });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
  }
};

export const pronosService = {
  getPronos: async (date?: string) => {
    if (USE_MOCK) {
      return mockApi.getPronos(date);
    }
    return api.get('/pronos', { params: { date } });
  },
  
  getPronoById: async (id: string) => {
    if (USE_MOCK) {
      return mockApi.getPronoById(id);
    }
    return api.get(`/pronos/${id}`);
  }
};

export const userService = {
  getProfile: async () => {
    if (USE_MOCK) {
      return mockApi.getUser();
    }
    return api.get('/user/profile');
  }
};
