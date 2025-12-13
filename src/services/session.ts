import { CartItem } from '../types';
import { buildApiUrl } from './api';

export type SessionEventType = 'view-item' | 'add-to-cart' | 'checkout-start';

export interface SessionEventPayload {
  type: SessionEventType;
  itemId?: string;
  itemTitle?: string | null;
  quantity?: number;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  details?: Record<string, unknown>;
  cartItems?: CartItem[];
}

export async function logSessionEvent(payload: SessionEventPayload): Promise<void> {
  try {
    const response = await fetch(buildApiUrl('/session/events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, details: payload.details ?? { cartItems: payload.cartItems } }),
    });

    if (!response.ok) {
      console.warn('Failed to log session event', response.statusText);
    }
  } catch (error) {
    console.error('Failed to log session event', error);
  }
}
