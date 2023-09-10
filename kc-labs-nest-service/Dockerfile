FROM node:18.17-alpine

ARG PORT

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

EXPOSE ${PORT}

CMD ["npm", "start"]