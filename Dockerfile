FROM node:14
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production

COPY . .

CMD ["node", "./src/index.js"]

EXPOSE 80