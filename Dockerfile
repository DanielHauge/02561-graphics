FROM golang as build-stage
WORKDIR /go/workdir

# Copy the server code into the container
COPY . /go/workdir

RUN go build

# Production
FROM golang as production-stage
WORKDIR /go/workdir
COPY --from=build-stage /go/workdir/dtu-computer-graphics /go/workdir/dtu-computer-graphics
COPY --from=build-stage /go/workdir/html /go/workdir/html
EXPOSE 443
EXPOSE 80
ENTRYPOINT ["./dtu-computer-graphics"]