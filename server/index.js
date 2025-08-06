  //index.js
  //express + socket.io entry point

  const express = require('express')
  const http = require('http')
  const cors = require('cors')
  const { Server } = require('socket.io')
  const { v4: uuid } = require('uuid')

  //db helpers that i wrote in db.js
  //have delete functions here, but havent used them in front end yet
  const {
    getAllData,
    createItem,
    createFolder,
    updateItem,
    updateFolder,
    deleteItem,
    deleteFolder
  } = require('./db')

  const app = express()
  app.use(cors())
  app.use(express.json())

  //http server wrapper
  const server = http.createServer(app)

  //socket.io on top of the same server
  const io = new Server(server, { 
    cors: { origin: '*' }
  })

  //API routes

  //initial snapshot
  app.get('/api/data', async (req, res) => {
    try {
      const data = await getAllData()
      res.json(data)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'db error' })
    }
  })

  //create item
  app.post('/api/item', async (req, res) => {
    try {
      const newItem = { ...req.body, id: uuid() }
      await createItem(newItem)

      res.status(201).json(newItem)
      io.emit('itemCreated', newItem) //broadcast to all tabs
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'db error' })
    }
  })

  //update item
  app.put('/api/item/:id', async (req, res) => {
    try {
      const id = req.params.id
      const updates = req.body

      const payload = await updateItem(id, updates)
      res.json(payload)
      io.emit('itemUpdated', payload)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'db error' })
    }
  })

  //delete item
  app.delete('/api/item/:id', async (req, res) => {
    try {
      const id = req.params.id
      await deleteItem(id)

      const payload = { id, deleted: true }
      res.json(payload)
      io.emit('itemDeleted', payload)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'db error' })
    }
  })


  //create folder
  app.post('/api/folder', async (req, res) => {
      try {
        const newFolder = { ...req.body, id: uuid() }
        await createFolder(newFolder)
    
        res.status(201).json(newFolder)
        io.emit('folderCreated', newFolder) //broadcast to all tabs
      } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'db error' })
      }
    })

  //update folder
  app.put('/api/folder/:id', async (req, res) => {
    try {
      const id = req.params.id
      const updates = req.body

      const payload = await updateFolder(id, updates)
      res.json(payload)
      io.emit('folderUpdated', payload)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'db error' })
    }
  })


  //delete folder
  app.delete('/api/folder/:id', async (req, res) => {
    try {
      const id = req.params.id
      await deleteFolder(id)

      const payload = { id, deleted: true }
      res.json(payload)
      io.emit('folderDeleted', payload)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'db error' })
    }
  })


  //socket.io
  io.on('connection', (socket) => {
    console.log('client connected', socket.id)

    //auto-push snapshot right away
    getAllData().then((data) => socket.emit('initialData', data))

    socket.on('disconnect', () => {
      console.log('client disconnected', socket.id)
    })
  })

  //start server
  const PORT = process.env.PORT || 5000
  server.listen(PORT, () => console.log('server listening on', PORT))
  