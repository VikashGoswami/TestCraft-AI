import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

const client = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // Sanctum SPA cookie auth
  withXSRFToken: true,   // Required for Axios 1.6+ cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let csrfInitialized = false;
let csrfPromise: Promise<void> | null = null;

export async function initCsrf(): Promise<void> {
  if (csrfInitialized) return;
  if (!csrfPromise) {
    csrfPromise = axios
      .get(`${API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
        withXSRFToken: true,
      })
      .then(() => {
        csrfInitialized = true;
      })
      .catch((err) => {
        console.warn('Failed to initialize CSRF cookie:', err);
      })
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

client.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
    await initCsrf();
    const token = getCookie('XSRF-TOKEN');
    if (token && !config.headers['X-XSRF-TOKEN']) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    // Reset CSRF state on auth mutations so fresh tokens are used
    if (response.config.url?.includes('/auth/')) {
      csrfInitialized = false;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 419) {
      csrfInitialized = false;
    }
    return Promise.reject(error);
  },
);

export default client;
