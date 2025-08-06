import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Item as ItemType } from '../types'

//Item.tsx – represents one draggable item card.
interface Props {
  item: ItemType
}

//definign what an individual item card should look like
const Item: React.FC<Props> = ({ item }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="item-card"
    >
      <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
      <div style={{ fontSize: 14 }}>{item.title}</div>
    </div>
  )
}

export default Item
 