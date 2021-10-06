package main
import (
	"log"
	"net/http"
	"github.com/rs/cors"
)
func main() {
	
	fs := http.FileServer(http.Dir("./html"))
	handler := cors.Default().Handler(fs)
	log.Println("Serving at localhost:80...")
	log.Fatal(http.ListenAndServe(":80", handler))
}