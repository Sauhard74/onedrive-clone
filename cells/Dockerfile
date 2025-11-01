# OneDrive Clone Dockerfile
# Based on Pydio Cells with OneDrive theming

FROM golang:1.25-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git make

# Copy source code
COPY . .

# Copy OneDrive theme CSS
COPY ../branding/css/onedrive-theme.css frontend/assets/gui.ajax/res/dist/onedrive-theme.css

# Build Pydio Cells
RUN make dev

# Final stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates curl

WORKDIR /var/cells

# Copy binary
COPY --from=builder /build/cells /usr/local/bin/cells

# Create data directory
RUN mkdir -p /var/cells/data /var/cells/logs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -k -f https://localhost:8080/a/frontend/bootconf || exit 1

ENTRYPOINT ["cells"]
CMD ["start"]
