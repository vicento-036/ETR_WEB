# React Login System

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the React development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

## Notes

- This project is a Vite + React UI.
- Authentication and database access are handled by the `Etris_WebAPI` backend.
- Run the WebAPI at the same time so the UI can call `/api/login` and `/api/health`.
