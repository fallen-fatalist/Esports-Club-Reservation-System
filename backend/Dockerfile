FROM golang:alpine AS builder

WORKDIR /app

COPY . /app

RUN go build -o /app/bin/booking-service /app

FROM alpine:latest AS runner

WORKDIR /app 

COPY --from=builder /app/bin /app

EXPOSE 8080

CMD ["/app/booking-service"]