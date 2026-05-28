# Dockerfile for Node.js Express Backend
FROM node:20-alpine

WORKDIR /app

COPY account-management/package*.json ./
RUN npm install --omit=dev

COPY account-management/. .

# Expose the port (default 4000, can be overridden by env)
EXPOSE 4000

CMD ["node", "index.js"]
