FROM node:22-alpine

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
