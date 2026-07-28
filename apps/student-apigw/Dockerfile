# Build context must be the repo root: docker build -f apps/student-apigw/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json ./
COPY apps/payment-service/package.json ./apps/payment-service/
COPY apps/students-service/package.json ./apps/students-service/
COPY apps/student-apigw/package.json ./apps/student-apigw/
RUN npm install
COPY libs ./libs
COPY apps/student-apigw ./apps/student-apigw
RUN npm run build --workspace apps/student-apigw

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/student-apigw/dist ./apps/student-apigw/dist
COPY --from=builder /app/apps/student-apigw/package.json ./apps/student-apigw/package.json
COPY libs ./libs
WORKDIR /app/apps/student-apigw
EXPOSE 3000
CMD ["node", "dist/main.js"]
