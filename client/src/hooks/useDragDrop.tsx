import React, { ReactNode, ReactElement } from 'react'
import {
  DndContext,
  closestCenter,
  pointerWithin,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useApp } from '../context'
import { ID } from '../types'
import { useDroppable } from '@dnd-kit/core'

interface DragDropHelpers {
  BoardDndProvider: React.FC<{ children: ReactNode }>
  getSortableContext: (
    containerId: ID | 'board' | 'folders',
    children: ReactNode,
  ) => ReactElement
  BoardDroppable: React.FC<{ children: ReactNode }>
}

export function useDragDrop(): DragDropHelpers {
  const { items, folders, updateItem, updateFolder } = useApp()
  
  // const sensors = useSensors(
  //   // useSensor(PointerSensor),
  //  useSensor(TouchSensor, {
  //     // activationConstraint: {
  //     //   delay: 0,
  //     //   tolerance: 0,
  //     },
  //   // }),
  //   // useSensor(MouseSensor)
  // ))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // activationConstraint: {
      //   delay: 10,
      //   tolerance: 10,
      //   distance: 10,
      // },
    })
  )
  
  
  const [activeId, setActiveId] = React.useState<ID | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as ID)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    try {

    const draggedItem = items.find(i => i.id === active.id)
    const targetItem = items.find(i => i.id === over.id)
    const draggedFolder = folders.find(f => f.id === active.id)
    const targetFolder = folders.find(f => f.id === over.id)

    //possibility 1 - reorder loose items
    if (draggedItem && targetItem && draggedItem.folderId === null && targetItem.folderId === null) {
      const looseItems = items
        .filter(i => i.folderId === null)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const oldIndex = looseItems.findIndex(i => i.id === draggedItem.id)
      const newIndex = looseItems.findIndex(i => i.id === targetItem.id)

      const reordered = [...looseItems]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      await Promise.all(reordered.map((item, idx) =>
        updateItem(item.id, { orderIndex: idx })
      ))
      return
    }

    //possibility 2 - reorder items within a folder
    if (draggedItem && targetItem && draggedItem.folderId === targetItem.folderId && draggedItem.folderId !== null) {
      const folderItems = items
        .filter(i => i.folderId === draggedItem.folderId)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const oldIndex = folderItems.findIndex(i => i.id === draggedItem.id)
      const newIndex = folderItems.findIndex(i => i.id === targetItem.id)

      const reordered = [...folderItems]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      await Promise.all(reordered.map((item, idx) =>
        updateItem(item.id, { orderIndex: idx })
      ))
      return
    }

    //possibility 3 - reorder folders
    if (draggedFolder && targetFolder) {
      const folderList = [...folders].sort((a, b) => a.orderIndex - b.orderIndex)

      const oldIndex = folderList.findIndex(f => f.id === draggedFolder.id)
      const newIndex = folderList.findIndex(f => f.id === targetFolder.id)

      const reordered = [...folderList]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      await Promise.all(reordered.map((folder, idx) =>
        updateFolder(folder.id, { orderIndex: idx })
      ))
      return
    }

    //possibility 4/5 - move item across folders or to/from loose area
    if (draggedItem && targetItem && draggedItem.folderId !== targetItem.folderId) {
      const newFolderId = targetItem.folderId ?? null

      const siblingItems = items
        .filter(i => i.folderId === newFolderId)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const insertIndex = siblingItems.findIndex(i => i.id === targetItem.id)

      const reordered = [...siblingItems]
      reordered.splice(insertIndex, 0, { ...draggedItem, folderId: newFolderId })

      await updateItem(draggedItem.id, {
        folderId: newFolderId,
        orderIndex: insertIndex,
      })

      await Promise.all(reordered.map((item, idx) =>
        updateItem(item.id, { orderIndex: idx, folderId: newFolderId })
      ))
      return
    }

    //handle dropping item directly on a folder (not an item)
    if (draggedItem && targetFolder) {
      const siblingItems = items
        .filter((i) => i.folderId === targetFolder.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const newIndex = siblingItems.length //append

      await updateItem(draggedItem.id, {
        folderId: targetFolder.id,
        orderIndex: newIndex,
      })

      //shift indices if needed
      await Promise.all(
        siblingItems.map((item, idx) => updateItem(item.id, { orderIndex: idx })),
      )
      return
    }

    //handle dropping item onto empty "items" space (board) – dnd-kit will report over.id === 'board'
    if (draggedItem && over.id === 'board') {
      const loose = items
        .filter((i) => i.folderId === null && i.id !== draggedItem.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const newIndex = loose.length
      
      await updateItem(draggedItem.id, { folderId: null, orderIndex: newIndex })

      await Promise.all(
        loose.map((item, idx) => updateItem(item.id, { orderIndex: idx })),
      )
      return
    }

    } finally {
      setActiveId(null)
    }
  }
  

  const getIdsForContainer = (containerId: ID | 'board' | 'folders') => {
    //container for folder list
    if (containerId === 'folders') {
      return folders
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((f) => f.id)
    }

    //board (loose items)
    if (containerId === 'board') {
      const looseItems = items
        .filter((it) => it.folderId === null)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      
      const ids = looseItems.map((it) => it.id)
      if (ids.length === 0) {
        return ['board']
      }
      return ids
    }

    //items within a folder
    return items
      .filter((it) => it.folderId === containerId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((it) => it.id)
  }

  //create dedicated board droppable wrapper
  const BoardDroppable: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setNodeRef } = useDroppable({ id: 'board' })
    return <div ref={setNodeRef}>{children}</div>
  }

  const customCollisionDetection = (args: any) => {
    //prefer pointer within results first for precise drop area (board when empty)
    const pointerCollisions = pointerWithin(args) //all droppable zones poitner is corrently inside

    if (pointerCollisions.length > 0) {
      //prefer first non-board collision so we can insert between loose items
      const firstNonBoard = pointerCollisions.find(c => c.id !== 'board')
      if (firstNonBoard) {
        return [firstNonBoard]
      }
      //otherwise board is fine
      return pointerCollisions
    }
    return closestCenter(args)
  }

  const BoardDndProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeId ? (
          (() => {
            const activeItem = items.find((it) => it.id === activeId)
            if (activeItem) return <div className="item-card" style={{ opacity: 0.8 }}><div style={{fontSize:24,marginBottom:4}}>{activeItem.icon}</div>{activeItem.title}</div>
            const activeFolder = folders.find((f) => f.id === activeId)
            if (activeFolder) return <div className="folder-card" style={{opacity:0.8, width:180}}>{activeFolder.name}</div>
            return null
          })()
        ) : null}
      </DragOverlay>
    </DndContext>
  )

  const getSortableContext = (
    containerId: ID | 'board' | 'folders',
    children: ReactNode,
  ): ReactElement => (
    <SortableContext
      id={containerId}
      items={getIdsForContainer(containerId)}
      strategy={verticalListSortingStrategy}
    >
      {children}
    </SortableContext>
  )

  return {
    BoardDndProvider,
    getSortableContext,
    BoardDroppable,
  }
} 