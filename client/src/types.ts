//types.ts
//central place for type definitions so every other file can import from one source

//unique identifier shortcut
export type ID = string

//represents a single loose item or an item inside a folder
export interface Item {
  id: ID
  title: string
  icon: string
  description?: string //optional – user may skip
  folderId: ID | null   //null → loose area
  orderIndex: number
}

//represents a folder that can contain many items
export interface Folder {
  id: ID
  name: string
  isOpen: boolean
  orderIndex: number
}

//helper shapes for API payloads (what the server sends back)
export interface InitialData {
  items: Item[]
  folders: Folder[]
}

export interface DeleteResponse {
  id: ID
  deleted: true
}
