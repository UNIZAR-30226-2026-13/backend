FROM node:24 AS app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 1337

CMD [ "npm", "run", "dev" ]