const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, 'data.db')

const db = new sqlite3.Database(dbPath)

//create tables if they so far do not exist
db.serialize(() => {
  //items table 
  db.run(`
    create table if not exists items (
      id text primary key,
      title text not null,
      icon text not null,
      description text,
      folderId text,
      orderIndex integer not null
    )
  `)

  //folders table
  db.run(`
    create table if not exists folders (
      id text primary key,
      name text not null,
      isOpen integer default 1,
      orderIndex integer not null
    )
  `)
})

//get all data initial page load
function getAllData () {
  return new Promise((resolve, reject) => {
    const data = { items: [], folders: [] }

    db.all('select * from items', (err, itemRows) => {
      if (err) { reject(err); return }
      data.items = itemRows

      db.all('select * from folders', (err2, folderRows) => {
        if (err2) { reject(err2); return }
        data.folders = folderRows
        resolve(data)
      })
    })
  })
}

//add a new item
function createItem (item) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      insert into items (id, title, icon, description, folderId, orderIndex)
      values (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      item.id,
      item.title,
      item.icon,
      item.description ?? null,
      item.folderId ?? null,
      item.orderIndex ?? 0,
      err => (err ? reject(err) : resolve(item))
    )
  })
}

//add a new folder
function createFolder (folder) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      insert into folders (id, name, isOpen, orderIndex)
      values (?, ?, ?, ?)
    `)
    stmt.run(
      folder.id,
      folder.name,
      folder.isOpen ? 1 : 0,
      folder.orderIndex ?? 0,
      err => (err ? reject(err) : resolve(folder))
    )
  })
}

//updae functions
//was facing problem whiel using coalesce
//folderID can really be nulll - so dont coalesce it
//but now, even on just reordering, the update folderID gets null - which makes the item loose
//so - use this setClauses thign instead of coalesce
function updateItem (id, updates) {
  return new Promise((resolve, reject) => {
    const folderIdValue = updates.folderId === undefined ? null : updates.folderId
    
    //build dynamic SQL - only update fields that are provided
    const setClauses = []
    const params = []
    
    if (updates.title !== undefined) {
      setClauses.push('title = ?')
      params.push(updates.title)
    }
    if (updates.icon !== undefined) {
      setClauses.push('icon = ?') 
      params.push(updates.icon)
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?')
      params.push(updates.description)
    }
    if (updates.folderId !== undefined) {
      setClauses.push('folderId = ?')
      params.push(folderIdValue)
    }
    if (updates.orderIndex !== undefined) {
      setClauses.push('orderIndex = ?')
      params.push(updates.orderIndex)
    }
    
    if (setClauses.length === 0) {
      //no fields to update
      db.get('select * from items where id = ?', [id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
      return
    }
    
    const sql = `update items set ${setClauses.join(', ')} where id = ?`
    params.push(id)
    
    const stmt = db.prepare(sql)
    stmt.run(...params, function(err) {
      if (err) {
        reject(err)
        return
      }
      // fetch the complete updated item
      db.get('select * from items where id = ?', [id], (err2, row) => {
        if (err2) reject(err2)
        else resolve(row)
      })
    })
  })
}
  
function updateFolder (id, updates) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      update folders set
        name       = coalesce(?, name),
        isOpen     = coalesce(?, isOpen),
        orderIndex = coalesce(?, orderIndex)
      where id = ?
    `)
    stmt.run(
      updates.name ?? null,
      updates.isOpen === undefined ? null : updates.isOpen ? 1 : 0,
      updates.orderIndex ?? null,
      id,
      function(err) {
        if (err) {
          reject(err)
          return
        }
        // fetch the complete updated folder
        db.get('select * from folders where id = ?', [id], (err2, row) => {
          if (err2) reject(err2)
          else resolve({
            ...row,
            isOpen: !!row.isOpen // convert SQLite 0/1 back to boolean
          })
        })
      }
    )
  })
}

//deletion functions (not ipmetlentd in UI yet)
function deleteItem (id) {
  return new Promise((resolve, reject) => {
    db.run('delete from items where id = ?', [id], err => {
      if (err) { reject(err); return }
      resolve({ id, deleted: true })
    })
  })
}

function deleteFolder (id) {
  return new Promise((resolve, reject) => {
    //unlink items first so they become loose
    db.run('update items set folderId = null where folderId = ?', [id], err => {
      if (err) { reject(err); return }

      db.run('delete from folders where id = ?', [id], err2 => {
        if (err2) { reject(err2); return }
        resolve({ id, deleted: true })
      })
    })
  })
}

module.exports = {
  db,           
  getAllData,
  createItem,
  createFolder,
  updateItem,
  updateFolder,
  deleteItem,
  deleteFolder
}