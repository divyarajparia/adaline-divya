import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Folder as FolderType, ID } from '../types'
import { useApp } from '../context'
import Item from './Item'
import { useDragDrop } from '../hooks/useDragDrop'

//Folder.tsx – represents one folder box
interface Props {
  folder: FolderType
}

const Folder: React.FC<Props> = ({ folder }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: folder.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const { items, toggleFolderOpen } = useApp()
  const folderItems = items
    .filter((it) => it.folderId === folder.id)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  //sortable context for inside items
  const { getSortableContext } = useDragDrop()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="folder-card"
    >
      {/*folder header with chevron*/}
      <button
        onPointerDown={(e) => e.stopPropagation()} //prevent drag when clicking toggle
        className="folder-header"
        onClick={() => toggleFolderOpen(folder.id)}
      >
        📁 {folder.name}
        <span style={{ marginLeft: 4, fontSize: 12 }}>
          {folder.isOpen ? '▼' : '►'}
        </span>
      </button>
      {/*show items only when folder is open*/}
      {folder.isOpen ? getSortableContext(
        folder.id as ID,
        <div className="folder-items-row">
          {folderItems.map((it) => (
            <Item key={it.id} item={it} />
          ))}
        </div>,
      ) : null}
    </div>
  )
}

export default Folder
 