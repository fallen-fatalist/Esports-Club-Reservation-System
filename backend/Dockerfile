from golang:alpine as builder

workdir /app

copy . /app

run go build -o /app/bin/booking-service /app

from alpine:latest as runner

workdir /app 

copy --from=builder /app/bin /app

expose 8080

cmd ["/app/booking-service"]
