# Deploying to Render

Prerequisites:
- A Render account
- A MongoDB Atlas cluster (or other hosted MongoDB) and connection string

Steps:

1. Push this repository to a Git provider (GitHub, GitLab, Bitbucket).
2. On Render, import this repository and choose "Manual" or connect to the repo for automated deploys.
3. Use the provided `render.yaml` to create two services:
   - `client-backend` (Dockerfile: `account-management/Dockerfile`)
   - `client-frontend` (Dockerfile: `client-ui/Dockerfile`)
4. In the Render dashboard, set the following environment variables:
   - For `client-backend` → `MONGODB_URI` = your Atlas connection string
   - For `client-frontend` → `NEXT_PUBLIC_API_URL` = `https://<your-backend-service>.onrender.com/api`
5. Deploy. The frontend will read `NEXT_PUBLIC_API_URL` at build/runtime and call your backend.

Notes:
- You can update `render.yaml` values or provide env vars in the Render UI.
- For production, consider using a managed database and adding HTTPS, autoscaling, and backups.
