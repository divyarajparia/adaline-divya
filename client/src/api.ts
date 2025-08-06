//api.ts
//handles REST calls + creates a single socket.io-client instance (per tab) for real time updates

import { io, Socket } from 'socket.io-client'
import { Item, Folder, InitialData } from './types'

const BASE_URL = 'http://localhost:5000'

//generic fetch wrapper
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    ...options,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

//REST helpers
//we define funcions that interact with backend via REST api calls
export const api = {
  //initial snapshot
  loadData: () => request<InitialData>('/api/data'),

  //create item
  //way to use this functionality:
  //await api.createItem({ title: 'New Item', folderId: '1' }) 
  createItem: (body: Partial<Item>) =>
    request<Item>('/api/item', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  //update item
  updateItem: (id: string, body: Partial<Item>) =>
    request<Item>(`/api/item/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  //delete item
  deleteItem: (id: string) =>
    request<{ id: string; deleted: true }>(`/api/item/${id}`, {
      method: 'DELETE',
    }),

  //create folder
  createFolder: (body: Partial<Folder>) =>
    request<Folder>('/api/folder', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  //update folder
  updateFolder: (id: string, body: Partial<Folder>) =>
    request<Folder>(`/api/folder/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  //delete folder
  deleteFolder: (id: string) =>
    request<{ id: string; deleted: true }>(`/api/folder/${id}`, {
      method: 'DELETE',
    }),
}

//webocket helper
//we use socket.io to get real-time updates
let socket: Socket | null = null
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE_URL)
  }
  return socket
}

//utility to emit events, mainly used by context actions
export const emit = <T>(event: string, data: T) => {
  getSocket().emit(event, data)
}
