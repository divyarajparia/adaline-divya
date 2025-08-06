## Adaline Full Stack Challenge

### Installation and Running

```bash
#clone this repo
cd adaline-lite

#install dependencies for both client and server
npm run install-deps

#start both client and server concurrently
npm run dev
```

The application will be at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### option 2 - manual setup

Run client and server separately:

```bash
#terminal 1 - ttart the server
cd server
npm install
npm run dev

#terminal 2 - start the client
cd client
npm install
npm start
```

## Please note

- The database file (`server/data.db`) will be created automatically on first run
- The application supports touchpad click and mouse click for drag-and-drop. Please note,
it will require double click for it.