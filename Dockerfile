FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM base
COPY --from=install /app/node_modules node_modules
COPY src src
COPY tsconfig.json .

USER bun
EXPOSE 3000/tcp
CMD ["bun", "run", "src/index.ts"]
