# React Login System

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Build the React app:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Development

For development with hot reload:
```bash
npm run dev
```

This will start the React development server on port 3000.

## Folder Structure

- `src/` - React source files
  - `components/` - React components
    - `Login.jsx` - Login form component
  - `App.js` - Main App component
  - `index.js` - React entry point
- `public/` - Static assets
- `build/` - Production build (created after running `npm run build`)
- `server.js` - Express server
- `index.html` - React HTML template

## Features

- React-based login form with state management
- Express backend API for authentication
- MSSQL database integration
- Clean, responsive UI
