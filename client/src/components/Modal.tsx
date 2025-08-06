import React, { useState } from 'react'
import { Item, Folder } from '../types'
import { useApp } from '../context'

//Modal.tsx is basically a generic popup for creating OR editing an item folder.

export type ModalMode =
  | { type: 'item'; initial?: Partial<Item> }
  | { type: 'folder'; initial?: Partial<Folder> }

interface Props {
  mode: ModalMode
  onClose: () => void
}

const Modal: React.FC<Props> = ({ mode, onClose }) => {
  const { addItem, addFolder, folders } = useApp()


  //local form state
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  

  //submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode.type === 'item') {
      if (title.trim() === '') {
        alert('Title is required')
        return
      }
      await addItem({
        title,
        icon: icon || '📄', //fallback icon
        folderId: folderId || null,
        description,
      })
      onClose()
    }
    else if (mode.type === 'folder') {
      if (name.trim() === '') {
        alert('Name is required')
        return
      }
      await addFolder({ name })
      onClose()
    }
  }

  //render
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">
          {mode.type === 'item' ? 'New Item' : 'New Folder'}
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          {mode.type === 'item' && (
            <>
              <input
                className="modal-input"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <select
                className="modal-input"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              >
                <option value="">Choose an icon…</option>
                <option value="📄">📄 File</option>
                <option value="📁">📁 Folder</option>
                <option value="✅">✅ Tick</option>
                <option value="⭐">⭐ Star</option>
                <option value="🔥">🔥 Fire</option>
                <option value="🎯">🎯 Target</option>
                <option value="💡">💡 Idea</option>
                <option value="🚀">🚀 Rocket</option>
                <option value="⚙️">⚙️ Gear</option>
                <option value="📝">📝 Note</option>
              </select>
              <select
                className="modal-input"
                value={folderId || ''}
                onChange={(e) =>
                  setFolderId(e.target.value === '' ? null : e.target.value)
                }
              >
                <option value="">— Loose Item —</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <input
                className="modal-input"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </>
          )}

          {mode.type === 'folder' && (
            <input
              className="modal-input"
              placeholder="Folder Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-button modal-button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button modal-button-save"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Modal
 