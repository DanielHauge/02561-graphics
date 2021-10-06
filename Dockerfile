FROM golang as build-stage
WORKDIR /go

# Copy the server code into the container
COPY . /go

RUN go build

# Production
FROM golang as production-stage
WORKDIR /go
COPY --from=build-stage /go/go /go/go
COPY --from=build-stage /go/html /go/html
# COPY --from=build-stage /go/TestCerts /go
EXPOSE 443
EXPOSE 80
ENTRYPOINt ["./go"]