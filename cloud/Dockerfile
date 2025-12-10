
# Build stage
FROM golang:1.25 AS builder
WORKDIR /app
COPY . .
RUN go mod init web4app || true
RUN go mod tidy
RUN go build -o web4app main.go

# Run stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/web4app .
COPY static ./static
EXPOSE 8080
ENV PORT=8080
CMD ["./web4app"]
