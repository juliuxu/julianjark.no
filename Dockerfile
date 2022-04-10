FROM node:16-slim

WORKDIR /myapp

# Build
COPY package.json package-lock.json ./
RUN npm install
COPY ./ .
RUN npm run build

# Need ENV NOTION_TOKEN=<something>
EXPOSE 3000

# Run
ENV NODE_ENV production
CMD ["npm", "start"]