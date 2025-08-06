import React, { useState } from 'react'
import Modal, { ModalMode } from './Modal'

//Header.tsx – shows app title and placeholder buttons.
//Later you'll add search bar, add-item/folder buttons, and connection status.
const Header: React.FC = () => {
  const [modal, setModal] = useState<ModalMode | null>(null)

  return (
    <header className="app-header">
<h1 className="app-title">
  <img
    src="/image.png"
    alt="Logo"
    style={{ height: 32, marginRight: 8, verticalAlign: 'middle' }}
  />
  FS Challenge!
</h1>
      <div className="actions">
        <button
          className="action-button item-btn"
          onClick={() => setModal({ type: 'item' })}
        >
          + Item
        </button>
        <button
          className="action-button folder-btn"
          onClick={() => setModal({ type: 'folder' })}
        >
          + Folder
        </button>
      </div>

      {modal && <Modal mode={modal} onClose={() => setModal(null)} />}
    </header>
  )
}

export default Header
