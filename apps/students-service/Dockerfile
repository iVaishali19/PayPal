# Build context must be the repo root: docker build -f apps/students-service/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json ./
COPY apps/payment-service/package.json ./apps/payment-service/
COPY apps/students-service/package.json ./apps/students-service/
COPY apps/student-apigw/package.json ./apps/student-apigw/
RUN npm install
COPY libs ./libs
COPY apps/students-service ./apps/students-service
RUN npm run build --workspace apps/students-service

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/students-service/dist ./apps/students-service/dist
COPY --from=builder /app/apps/students-service/package.json ./apps/students-service/package.json
COPY libs ./libs
WORKDIR /app/apps/students-service
EXPOSE 3004 50062
CMD ["node", "dist/main.js"]
