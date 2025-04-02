# Real-Time Chat App

This is a real-time chat application built for the AuthCast assignment. Users can create chat rooms, join existing rooms, and chat with others in real-time. New messages are displayed instantly, and a sound notification plays when a new message arrives (after enabling sounds).

## Tech Stack
- **Frontend**: React (using Vite)
- **Backend/Database**: Supabase (real-time database)
- **Dependencies**: `@supabase/supabase-js`, `react-router-dom`

## Features
- Create new chat rooms.
- See a list of available chat rooms and join any room.
- Send and receive messages in real-time within a chat room.
- All users in the same room see incoming messages instantly.
- A notification sound plays for new messages (after clicking "Enable Sounds" to comply with browser autoplay policies).

## Prerequisites
- **Node.js** (v16 or higher) and **npm** installed on your machine.
- A **Supabase** account and project set up (see setup instructions below).

## Setup Instructions

### 1. Clone the Repository

git clone https://github.com/<your-username>/realtime-chat-app.git
cd realtime-chat-app

### 2. Run the project
npm run dev