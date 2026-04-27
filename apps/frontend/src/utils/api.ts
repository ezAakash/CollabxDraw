import { API_BASE } from './constants';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}

export async function signup(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const res = await apiFetch('/user/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(data: { email: string; password: string }) {
  const res = await apiFetch('/user/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createRoom(slug: string, password?: string) {
  const res = await apiFetch('/room/create', {
    method: 'POST',
    body: JSON.stringify({ slug, password }),
  });
  return res.json();
}

export async function joinRoom(slug: string, password?: string) {
  const res = await apiFetch('/room/join', {
    method: 'POST',
    body: JSON.stringify({ slug, password }),
  });
  return res.json();
}

export async function getRooms() {
  const res = await apiFetch('/room/rooms');
  return res.json();
}

export async function deleteRoom(roomId: number) {
  const res = await apiFetch(`/room/${roomId}`, { method: 'DELETE' });
  return res.json();
}

export async function getRoomElements(roomId: number) {
  const res = await apiFetch(`/room/${roomId}/elements`);
  return res.json();
}
