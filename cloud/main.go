
package main

import (
    "log"
    "net/http"
    "os"
)

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    fs := http.FileServer(http.Dir("./static"))
    http.Handle("/", fs)

    log.Printf("Serving static files on http://localhost:%s\n", port)
    err := http.ListenAndServe(":" + port, nil)
    if err != nil {
        log.Fatal("Server failed:", err)
    }
}
