# Firebase Deployment Instructions

This file contains the step-by-step instructions to build and deploy the MMCY Reception application to Firebase. When the user requests a deployment, follow these exact steps.

## Steps

All commands should be run directly in this frontend directory (`/Users/sinishaw/Documents/MMCY/reception-app-flutter/reception-app-web/frontend`).

### 1. Build the Frontend App
Go to the frontend directory and build the production bundle:
- **Command**: `npm run build`

### 2. Deploy to Firebase
Deploy both hosting and firestore rules using:
- **Command**: `npx -y firebase-tools@latest deploy --only hosting,firestore:rules`

---
*Note: This file is used as a runbook by the AI agent to automate deployments.*
