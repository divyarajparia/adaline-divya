//context.tsx - centralised React Context wrapper for app-wide state
//holds react state for this tab

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { api, emit, getSocket } from './api'
import { Item, Folder, ID, InitialData } from './types'

//shape of what any component can access via useApp()
//shape of our global state + helper functions
//any compmonent using useApp() will have access to these latest values
export interface AppContextValue {
  //current snapshot
  items: Item[] 
  folders: Folder[]

  //CRUD helpers - all async because they hit the server
  addItem: (payload: Omit<Item, 'id' | 'orderIndex'>) => Promise<void>
  updateItem: (id: ID, changes: Partial<Item>) => Promise<void>
  deleteItem: (id: ID) => Promise<void>

  addFolder: (payload: Omit<Folder, 'id' | 'orderIndex' | 'isOpen'>) => Promise<void>
  updateFolder: (id: ID, changes: Partial<Folder>) => Promise<void>
  deleteFolder: (id: ID) => Promise<void>
  //toggle folder open/close state
  toggleFolderOpen: (id: ID) => Promise<void>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  //local state - React keeps it in memory; we still persist via API so page reloads restore everything
  const [items, setItems] = useState<Item[]>([])
  const [folders, setFolders] = useState<Folder[]>([])

  //initial fetch
  useEffect(() => {
    api.loadData().then((data: InitialData) => {
      setItems(data.items)
      setFolders(data.folders)
    })
  }, [])

  //CRUD actions
  const addItem: AppContextValue['addItem'] = async (payload) => {
    //orderIndex - append to end of current loose items list
    const newItem = await api.createItem({ ...payload, orderIndex: items.length })
    setItems((prev) => (prev.some((i) => i.id === newItem.id) ? prev : [...prev, newItem]))
    emit('itemCreated', newItem) //broadcast for other tabs
  }

  const updateItem: AppContextValue['updateItem'] = async (id, changes) => {
    const updatedItem = await api.updateItem(id, changes)
    // let socket listeners handle state updates to avoid race conditions
  }

  const deleteItem: AppContextValue['deleteItem'] = async (id) => {
    await api.deleteItem(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
    emit('itemDeleted', { id, deleted: true })
  }

  const addFolder: AppContextValue['addFolder'] = async (payload) => {
    const newFolder = await api.createFolder({
      ...payload,
      isOpen: true,
      orderIndex: folders.length,
    })
    setFolders((prev) => (prev.some((f) => f.id === newFolder.id) ? prev : [...prev, newFolder]))
    emit('folderCreated', newFolder)
  }

  const updateFolder: AppContextValue['updateFolder'] = async (id, changes) => {
    const updatedFolder = await api.updateFolder(id, changes)
    // don't update local state here - let the socket listener handle it
    // to avoid race conditions during bulk operations
  }

  const deleteFolder: AppContextValue['deleteFolder'] = async (id) => {
    await api.deleteFolder(id)
    setFolders((prev) => prev.filter((folder) => folder.id !== id))
    emit('folderDeleted', { id, deleted: true })
  }

  //flip a folder's isOpen flag, keep server & other tabs in sync
  const toggleFolderOpen: AppContextValue['toggleFolderOpen'] = async (id) => {
    const current = folders.find((f) => f.id === id)
    if (!current) return //should never happen but type-safe

    const nextIsOpen = !current.isOpen

    //1.optimistic local update for instant UI updatino
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isOpen: nextIsOpen } : f)),
    )

    try {
      //2.now make change to backend and broadcast it to other tabs
      const updated = await api.updateFolder(id, {
        isOpen: nextIsOpen,
        name: current.name,
        orderIndex: current.orderIndex,
      })
      setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)))
      emit('folderUpdated', updated)
    } catch (err) {
      console.error(err)
      //revert if server failed
      setFolders((prev) => prev.map((f) => (f.id === id ? current : f)))
      alert('Failed to toggle folder – please try again.')
    }
  }

  //realtime listeners - whenever another tab/user creates an item,
  //or does any other CRUD operation, we mirror it here
  useEffect(() => {
    const socket = getSocket()

    socket.on('itemCreated', (item: Item) =>
      setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item])),
    )
    socket.on('itemUpdated', (item: Item) =>
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i))),
    )
    socket.on('itemDeleted', ({ id }: { id: ID }) =>
      setItems((prev) => prev.filter((i) => i.id !== id)),
    )

    socket.on('folderCreated', (folder: Folder) =>
      setFolders((prev) =>
        prev.some((f) => f.id === folder.id) ? prev : [...prev, folder],
      ),
    )
    socket.on('folderUpdated', (folder: Folder) =>
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? folder : f))),
    )
    socket.on('folderDeleted', ({ id }: { id: ID }) =>
      setFolders((prev) => prev.filter((f) => f.id !== id)),
    )
    
    return () => {
      socket.off('itemCreated')
      socket.off('itemUpdated')
      socket.off('itemDeleted')
      socket.off('folderCreated')
      socket.off('folderUpdated')
      socket.off('folderDeleted')
    }
  }, [])

  //provider value
  const value: AppContextValue = {
    items,
    folders,
    addItem,
    updateItem,
    deleteItem,
    addFolder,
    updateFolder,
    deleteFolder,
    toggleFolderOpen,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
  //AppProvider basically provides all functionailty to AppContext, which is the container that holds the global app contextt
  //AppContect is then exported using useApp()
}

//easy helper so components can call useApp() without worrying about undefined
//UseApp is a custom hook that gives access to the global app state and functions
export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
