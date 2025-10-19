FROM node:22.17.0-alpine AS build-base
WORKDIR /app

FROM build-base AS build-dist
COPY package*.json ./
# Use the mounted .npmrc secret for authentication
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci --ignore-scripts && npm cache clean --force
COPY . .
RUN npm run build

FROM build-base AS build-prod-modules
COPY package*.json ./
# Use the mounted .npmrc secret for authentication
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    NODE_ENV=production npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force 

FROM node:22.17.0-alpine AS base

ARG BUILD_NUMBER
ARG BUILD_VERSION
ENV BUILD_NUMBER=$BUILD_NUMBER
ENV BUILD_VERSION=$BUILD_VERSION
ENV LOG_PATH=/var/log/configurable-module-example-rest-api

# Use buildx for multi-platform and specify the target architecture
ARG TARGETPLATFORM

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Create log directory and set proper ownership
RUN mkdir -p ${LOG_PATH} && \
    chown -R nestjs:nodejs ${LOG_PATH}

# Expose port
EXPOSE 80

FROM base AS release

# Set working directory
WORKDIR /app

# Install supervisor
RUN apk add --no-cache supervisor curl gcompat libc6-compat jq

# Suppress the setuptools deprecation warning
ENV PYTHONWARNINGS="ignore::UserWarning:supervisor.options"

# Download the correct Filebeat binary based on target platform
ARG FILEBEAT_VERSION=7.17.10
RUN case ${TARGETPLATFORM} in \
    "linux/amd64") FILEBEAT_ARCH="x86_64" ;; \
    "linux/arm64") FILEBEAT_ARCH="arm64" ;; \
    *) echo "Unsupported platform: ${TARGETPLATFORM}" && exit 1 ;; \
    esac && \
    curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-${FILEBEAT_VERSION}-linux-${FILEBEAT_ARCH}.tar.gz && \
    tar xzf filebeat-${FILEBEAT_VERSION}-linux-${FILEBEAT_ARCH}.tar.gz && \
    mv filebeat-${FILEBEAT_VERSION}-linux-${FILEBEAT_ARCH}/filebeat /usr/local/bin/ && \
    chmod +x /usr/local/bin/filebeat && \
    rm -rf filebeat-${FILEBEAT_VERSION}-linux-${FILEBEAT_ARCH}*

# Create log directory and set proper ownership
RUN mkdir -p /tmp/filebeat/data /tmp/filebeat/logs /tmp/filebeat/module && \
    chown -R nestjs:nodejs /tmp/filebeat

# Copy built application from builder stage (dist folder only)
COPY --from=build-prod-modules --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build-dist --chown=nestjs:nodejs /app/dist ./dist

# Copy public static files
COPY --from=build-dist --chown=nestjs:nodejs /app/public ./public

# Copy init script for ECS metadata
COPY --chown=nestjs:nodejs bin/init.sh ./bin/init.sh

# Copy Filebeat configuration
COPY devops/conf/filebeat.yml /etc/filebeat/

# Copy supervisor config
COPY devops/conf/supervisord.conf /etc/supervisord.conf

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 80

# Always run init script, but allow supervisor command to be overridden
ENTRYPOINT ["/bin/sh", "-c", ". /app/bin/init.sh && exec \"$@\"", "--"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
