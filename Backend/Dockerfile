FROM node:14-alpine

# Create a folder to compile the source in
WORKDIR /tmp
COPY package.json .
COPY package-lock.json .

# Install dependencies
RUN npm ci

# Copy remaining files
COPY . .

# Compile to JS
RUN npm run compile

# Copy dist and only install production packages
ENV NODE_ENV=production
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci

# Copy build to dist
RUN cp -r /tmp/dist/* . \
    && rm -rf /tmp

CMD ["node", "App.js"]