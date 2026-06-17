export const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem('greencampus_token');
  
  // If FormData is used, we shouldn't set Content-Type to application/json manually
  // because the browser needs to set it with the boundary.
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    // TODO: Handle token expiration better (e.g. refresh token)
    console.warn("Unauthorized request, token may be expired.");
    window.dispatchEvent(new Event('auth_expired'));
  }
  
  return response;
};
