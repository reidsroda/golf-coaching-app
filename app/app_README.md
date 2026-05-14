# /app

This folder contains the React Native + Expo frontend for the AI Golf Coach app, supporting both iOS and Android.

## Tech Stack

- **React Native** — cross-platform mobile framework
- **Expo** — build tooling, OTA updates, and App Store submission management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode installed (Mac only)
- Android: Android Studio installed

### Install dependencies

```bash
cd app
npm install
```

### Run the development server

```bash
npx expo start
```

Then press `i` to open in the iOS simulator or `a` for the Android emulator.

## Folder Structure

```
app/
├── /src
│   ├── /screens       # One file per screen (HomeScreen, AddRoundScreen, etc.)
│   ├── /components    # Reusable UI components
│   ├── /navigation    # React Navigation stack and tab configuration
│   ├── /hooks         # Custom React hooks
│   ├── /lib           # Supabase client and API helpers
│   └── /types         # Shared TypeScript types
├── app.json           # Expo config
└── package.json
```

## Branching

Follow the team branching convention: `feature/S-XXX-short-description` where `S-XXX` maps to the Linear story ID.
