FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /riftmeta-server ./cmd/server

# ---- Runtime ----
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /riftmeta-server ./riftmeta-server

EXPOSE 8080

CMD ["./riftmeta-server"]
