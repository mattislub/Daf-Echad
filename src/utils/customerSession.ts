import { CustomerAccount } from '../types';

const CUSTOMER_ACCOUNT_STORAGE_KEY = 'daf_customer_account';
const CUSTOMER_ACCOUNT_COOKIE_KEY = 'daf_customer_account';
export const CUSTOMER_ACCOUNT_SESSION_MS = 1000 * 60 * 60 * 24 * 7;

type StoredCustomerAccount = {
  account: CustomerAccount;
  expiresAt: number;
};

const parseStoredCustomerAccount = (raw: string): StoredCustomerAccount | null => {
  try {
    const parsed = JSON.parse(raw) as StoredCustomerAccount;
    if (!parsed?.account || !parsed?.expiresAt) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse stored customer account', error);
    return null;
  }
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  const [, value] = cookie.split('=');
  return value ? decodeURIComponent(value) : null;
};

const setCookieValue = (name: string, value: string, expiresAt: number) => {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = new Date(expiresAt).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const clearCookie = (name: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

const announceCustomerAccountChange = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent('customer-account-updated'));
};

const isExpired = (expiresAt: number) => expiresAt <= Date.now();

const syncLocalStorage = (stored: StoredCustomerAccount) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CUSTOMER_ACCOUNT_STORAGE_KEY, JSON.stringify(stored));
};

const removeStoredAccount = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CUSTOMER_ACCOUNT_STORAGE_KEY);
  }
  clearCookie(CUSTOMER_ACCOUNT_COOKIE_KEY);
};

export function loadStoredCustomerAccount(): CustomerAccount | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(CUSTOMER_ACCOUNT_STORAGE_KEY);
  if (stored) {
    const parsed = parseStoredCustomerAccount(stored);
    if (parsed && !isExpired(parsed.expiresAt)) {
      return parsed.account;
    }
    removeStoredAccount();
  }

  const cookieValue = getCookieValue(CUSTOMER_ACCOUNT_COOKIE_KEY);
  if (!cookieValue) {
    return null;
  }

  const parsedCookie = parseStoredCustomerAccount(cookieValue);
  if (!parsedCookie) {
    clearCookie(CUSTOMER_ACCOUNT_COOKIE_KEY);
    return null;
  }

  if (isExpired(parsedCookie.expiresAt)) {
    removeStoredAccount();
    return null;
  }

  syncLocalStorage(parsedCookie);
  return parsedCookie.account;
}

export function getStoredCustomerExpiry(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(CUSTOMER_ACCOUNT_STORAGE_KEY);
  if (stored) {
    const parsed = parseStoredCustomerAccount(stored);
    if (parsed && !isExpired(parsed.expiresAt)) {
      return parsed.expiresAt;
    }
    removeStoredAccount();
  }

  const cookieValue = getCookieValue(CUSTOMER_ACCOUNT_COOKIE_KEY);
  if (!cookieValue) {
    return null;
  }

  const parsedCookie = parseStoredCustomerAccount(cookieValue);
  if (!parsedCookie || isExpired(parsedCookie.expiresAt)) {
    removeStoredAccount();
    return null;
  }

  return parsedCookie.expiresAt;
}

export function persistCustomerAccount(account: CustomerAccount, expiresAt?: number) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredCustomerAccount = {
    account,
    expiresAt: expiresAt ?? Date.now() + CUSTOMER_ACCOUNT_SESSION_MS,
  };

  const serialized = JSON.stringify(payload);
  window.localStorage.setItem(CUSTOMER_ACCOUNT_STORAGE_KEY, serialized);
  setCookieValue(CUSTOMER_ACCOUNT_COOKIE_KEY, serialized, payload.expiresAt);
  announceCustomerAccountChange();
}

export function clearStoredCustomerAccount() {
  if (typeof window === 'undefined') {
    return;
  }

  removeStoredAccount();
  announceCustomerAccountChange();
}
