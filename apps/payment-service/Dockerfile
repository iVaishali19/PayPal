# Build context must be the repo root: docker build -f apps/payment-service/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json ./
COPY apps/payment-service/package.json ./apps/payment-service/
COPY apps/students-service/package.json ./apps/students-service/
COPY apps/student-apigw/package.json ./apps/student-apigw/
RUN npm install
COPY libs ./libs
COPY apps/payment-service ./apps/payment-service
RUN npm run build --workspace apps/payment-service

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/payment-service/dist ./apps/payment-service/dist
COPY --from=builder /app/apps/payment-service/package.json ./apps/payment-service/package.json
COPY libs ./libs
WORKDIR /app/apps/payment-service
EXPOSE 3003 50061
CMD ["node", "dist/main.js"]
