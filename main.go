package main

import (
	"log"
	"net/http"
)


func main() {
	http.Handle("/", http.FileServer(http.Dir("./html")))
	log.Println("Serving at localhost:80...")
	log.Fatal(http.ListenAndServe(":80", nil))
}