FROM node:18-alpine

WORKDIR /app

COPY dashboard/package*.json ./
RUN npm ci

COPY dashboard/ .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
