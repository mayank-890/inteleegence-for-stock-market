export type StoredUser = {
  email: string;
  name?: string;
};

const TOKEN_KEY = "b100_token";
const USER_KEY = "b100_user";
const API_KEY_STORAGE_KEY = "b100_api_key";

const isBrowser = () => typeof window !== "undefined";

export const getToken = () => {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string) => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
};

export const getStoredUser = (): StoredUser | null => {
  if (!isBrowser()) {
    return null;
  }
  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: StoredUser) => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(USER_KEY);
};

export const getApiKey = () => {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const setApiKey = (apiKey: string) => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
};

export const clearApiKey = () => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
};

export const clearSession = () => {
  clearToken();
  clearStoredUser();
  clearApiKey();
};

