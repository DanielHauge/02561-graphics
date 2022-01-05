package main

import (
	"log"
	"net/http"

	gosocketio "github.com/graarh/golang-socketio"
	"github.com/graarh/golang-socketio/transport"
	"github.com/rs/cors"
)

var (
	connections map[string]string
	observer    map[string]bool
	listener    map[string]bool
)

func main() {
	connections = make(map[string]string)
	observer = make(map[string]bool)
	listener = make(map[string]bool)
	http.Handle("/", cors.Default().Handler(http.FileServer(http.Dir("html/"))))
	http.HandleFunc("/c", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "html/Project/Controller/controller.html")
	})
	http.Handle("/socket.io/", initWS())
	log.Println("Serving at http://localhost:80 and https://localhost:443")

	go log.Println(http.ListenAndServeTLS(":443", "Certs/server.crt", "Certs/server.key", nil))
	log.Fatal(http.ListenAndServe(":80", nil))
}

type Event struct {
	SessionId string `json:"id"`
	EventType string `json:"type"`
	Value     string `json:"value"`
}

func initWS() *gosocketio.Server {
	server := gosocketio.NewServer(transport.GetDefaultWebsocketTransport())

	server.On(gosocketio.OnDisconnection, func(c *gosocketio.Channel) {
		sessionId := connections[c.Id()]
		c.BroadcastTo(sessionId, "disconnection", "null")
		observer[sessionId] = false
		connections[c.Id()] = ""
	})

	server.On("init-observer", func(c *gosocketio.Channel, msg string) string {
		listener[msg] = true
		c.Join(msg)
		return "OK"
	})

	server.On("event", func(c *gosocketio.Channel, msg Event) string {
		if msg.EventType == "connection" {
			if observer[msg.SessionId] || !listener[msg.SessionId] {
				return "BAD"
			} else {
				observer[msg.SessionId] = true
				connections[c.Id()] = msg.SessionId
			}
		}
		c.BroadcastTo(msg.SessionId, msg.EventType, msg.Value)
		return "OK"
	})

	return server
}
