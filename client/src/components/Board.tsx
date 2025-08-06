import React from 'react'
import { useApp } from '../context'
import Folder from './Folder'
import Item from './Item'
import { useDragDrop } from '../hooks/useDragDrop'

//lay out folders on top and loose items below.
//use tailwind for simple spacing
const Board: React.FC = () => {
  const { items, folders } = useApp()
  //get some drag and drop helpers we need
  const { BoardDndProvider, getSortableContext } = useDragDrop()

  //separate loose (no folder) items
  const looseItems = items.filter((it) => it.folderId === null)

  //get the droppable context for the board
  const { BoardDroppable } = useDragDrop()

  return (
    //wrap everywthing in BoardDndProvider
    <BoardDndProvider>
    <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {folders.length > 0 && <h2 style={{ marginBottom: 8 }}>Folders</h2>}
      {getSortableContext('folders', (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {folders
            .slice() //copy before sort to avoid mutating state
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((folder) => (
              <Folder key={folder.id} folder={folder} />
            ))}
        </section>
      ))}

      {/*always show Items section as drop zone*/}
      <h2 style={{ marginBottom: 8 }}>Items</h2>
      <BoardDroppable>
      {getSortableContext('board', (
        <section className="items-drop-zone">
          {looseItems.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', color: '#999', padding: 16 }}>
              Drop items here or use + Item button
            </div>
          ) : (
            looseItems
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((item) => (
                <Item key={item.id} item={item} />
              ))
          )}
        </section>
      ))}
      </BoardDroppable>

      {/* if both arrays are empty, render a friendly empty-state message */}
      {folders.length === 0 && looseItems.length === 0 && (
  <p style={{ textAlign: 'center', color: '#666' }}>Nothing here yet! Start by creating a folder or item.</p>
)}

    </main>
    </BoardDndProvider>
  )
}

export default Board
 