FROM node:18.17-alpine

#install curl
RUN apk add --no-cache curl

ARG PORT

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

EXPOSE ${PORT}

CMD ["npm", "start"]