package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sync"
	"sync/atomic"
	"time"
)

// --------------------- CONFIG ---------------------
type Config struct {
	MaxConcurrency int      `json:"max_concurrency"`
	MaxRetries     int      `json:"max_retries"`
	Tasks          []TaskSpec `json:"tasks"` // list of tasks to execute
}

// TaskSpec defines a single task in Web4
type TaskSpec struct {
	Type    string `json:"type"`    // "download", "ai", "blockchain", "storage"
	Payload string `json:"payload"` // URL, AI prompt, smart contract, file path, etc.
}

// Load configuration from env JSON or defaults
func loadConfig() Config {
	cfg := Config{
		MaxConcurrency: 3,
		MaxRetries:     2,
		Tasks: []TaskSpec{
			{Type: "download", Payload: "https://httpbin.org/get"},
			{Type: "ai", Payload: "Generate AI text for Web4 article"},
			{Type: "blockchain", Payload: "0xContractAddress:mintNFT"},
			{Type: "storage", Payload: "/tmp/sample.txt"},
		},
	}
	if v := os.Getenv("CONFIG_JSON"); v != "" {
		json.Unmarshal([]byte(v), &cfg)
	}
	return cfg
}

// --------------------- TASK RUNNER ---------------------
type Task struct {
	ID        int
	Spec      TaskSpec
	MaxRetries int
}

// Run executes a single task with retries
func (t Task) Run(successCounter, failureCounter *int32) {
	for attempt := 0; attempt <= t.MaxRetries; attempt++ {
		logTask(t.ID, attempt, fmt.Sprintf("Starting task type=%s payload=%s", t.Spec.Type, t.Spec.Payload))

		var err error
		switch t.Spec.Type {
		case "download":
			err = taskDownload(t.Spec.Payload)
		case "ai":
			err = taskAI(t.Spec.Payload)
		case "blockchain":
			err = taskBlockchain(t.Spec.Payload)
		case "storage":
			err = taskStorage(t.Spec.Payload)
		default:
			err = fmt.Errorf("unknown task type %s", t.Spec.Type)
		}

		if err != nil {
			logTask(t.ID, attempt, fmt.Sprintf("Attempt %d failed: %v", attempt, err))
			if attempt == t.MaxRetries {
				atomic.AddInt32(failureCounter, 1)
			} else {
				time.Sleep(time.Duration(500*int64(1<<attempt)) * time.Millisecond) // exponential backoff
			}
			continue
		}

		logTask(t.ID, attempt, fmt.Sprintf("Attempt %d succeeded", attempt))
		atomic.AddInt32(successCounter, 1)
		break
	}
}

// --------------------- TASK TYPES ---------------------

// Download a file from a URL
func taskDownload(url string) error {
	resp, err := http.Get(url)
	if err != nil || resp.StatusCode >= 400 {
		return fmt.Errorf("download failed: %v", err)
	}
	defer resp.Body.Close()

	fileName := fmt.Sprintf("task_download_%d.html", rand.Intn(1000))
	out, err := os.Create(fileName)
	if err != nil {
		return err
	}
	defer out.Close()
	io.Copy(out, resp.Body)
	return nil
}

// Simulate an AI task (placeholder for LLM call)
func taskAI(prompt string) error {
	time.Sleep(time.Millisecond * 500) // simulate AI compute time
	log.Printf("[AI] Generated content for prompt: %s", prompt)
	return nil
}

// Simulate blockchain interaction (placeholder)
func taskBlockchain(contractAction string) error {
	time.Sleep(time.Millisecond * 300) // simulate blockchain tx
	if rand.Float64() < 0.2 {         // simulate random failure
		return fmt.Errorf("blockchain tx failed")
	}
	log.Printf("[Blockchain] Executed contract action: %s", contractAction)
	return nil
}

// Simulate decentralized storage task (IPFS, Arweave)
func taskStorage(filePath string) error {
	time.Sleep(time.Millisecond * 200) // simulate file upload
	log.Printf("[Storage] Uploaded file: %s", filePath)
	return nil
}

// --------------------- LOGGING ---------------------
func logTask(taskID int, attempt int, msg string) {
	entry := map[string]interface{}{
		"timestamp": time.Now().Format(time.RFC3339),
		"taskID":    taskID,
		"attempt":   attempt,
		"message":   msg,
	}
	data, _ := json.Marshal(entry)
	log.Println(string(data))
}

// --------------------- MAIN ---------------------
func main() {
	rand.Seed(time.Now().UnixNano())
	cfg := loadConfig()
	log.Printf("Web4 Job Runner Configuration: %+v", cfg)

	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.MaxConcurrency)
	var successCounter int32
	var failureCounter int32

	for i, spec := range cfg.Tasks {
		wg.Add(1)
		sem <- struct{}{} // acquire slot
		go func(taskID int, taskSpec TaskSpec) {
			defer wg.Done()
			Task{
				ID:        taskID,
				Spec:      taskSpec,
				MaxRetries: cfg.MaxRetries,
			}.Run(&successCounter, &failureCounter)
			<-sem // release slot
		}(i, spec)
	}

	wg.Wait()
	log.Printf("Web4 Job Runner complete: Success=%d, Failure=%d", successCounter, failureCounter)
}
