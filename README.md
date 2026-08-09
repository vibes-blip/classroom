# Classroom

This project is a live classroom app with a real-time classroom experience.

## Architecture Overview

- **LiveKit** handles the actual video and audio streams.
  - LiveKit provides the media room, real-time video/audio transport, and track management.
  - The front-end connects to LiveKit with `src/livekitClient.js`.

- **Laravel** handles users, classes, and permissions.
  - Laravel is expected to own authentication, class records, role-based access, and backend APIs.
  - The React app calls backend endpoints such as `/api/classrooms`, `/api/messages`, and `/api/classrooms/:id/join`.

- **Socket.IO** handles classroom events and chat.
  - Real-time classroom events such as participant join/leave, media requests, whiteboard actions, and text chat use Socket.IO.
  - Socket.IO is configured in `src/App.tsx` and `server/server.js`.

- **PostgreSQL** stores permanent data.
  - Classroom persistence, user records, permissions, and message history are stored in PostgreSQL.
  - The backend should expose API routes that read and write to PostgreSQL.

## Key Files

- `src/App.tsx` — main React application and classroom UI logic.
- `src/livekitClient.js` — LiveKit connection helper.
- `src/classroomState.js` — local mock helpers for classroom creation and joining.
- `server/server.js` — Socket.IO and simple backend server example.
- `src/main.jsx` — React app entrypoint.

## Notes

- The current local Git repository was initialized and the code has been committed locally.
- A push attempt to `https://github.com/vibes-blip/classroom.git` failed due to GitHub permission restrictions in this environment.
