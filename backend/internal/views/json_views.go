package views

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

type Message struct {
	Message string `json:"message"`
}

type HTTPError struct {
	Error string `json:"error"`
}

func WriteJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(data); err != nil {
		slog.Error("Failed to encode JSON", "error", err, "data", data)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(statusCode)
	buf.WriteTo(w)
}

func ParseJSON(r *http.Request, v any) error {
	if r.Body == nil {
		return fmt.Errorf("missing request body")
	}
	return json.NewDecoder(r.Body).Decode(v)
}

func WriteError(w http.ResponseWriter, status int, err error) {
	w.Header().Set("Content-Type", "application/json")
	var buf bytes.Buffer
	httpErr := HTTPError{Error: err.Error()}

	if encodeErr := json.NewEncoder(&buf).Encode(httpErr); encodeErr != nil {
		slog.Error("Failed to encode error JSON", "error", encodeErr, "original_error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(status)
	buf.WriteTo(w)
}
