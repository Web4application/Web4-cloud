# Stage 1: Build
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o web4-runner .

# Stage 2: Minimal runtime
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/web4-runner .
EXPOSE 2112
CMD ["./web4-runner"]
