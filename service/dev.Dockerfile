FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

RUN  bun prisma generate

# Run in dev mode with hot reloading
CMD ["sh", "-c", "bun prisma db push && bun --watch src/server.ts"]
