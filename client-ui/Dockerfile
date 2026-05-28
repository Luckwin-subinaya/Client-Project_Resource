# Dockerfile for Next.js Frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY client-ui/package*.json ./
RUN npm install
COPY client-ui/. .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "start"]
