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
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/google/uuid"
)

// --------------------- CONFIG ---------------------
type Config struct {
	MaxConcurrency int        `json:"max_concurrency"`
	MaxRetries     int        `json:"max_retries"`
	Tasks          []TaskSpec `json:"tasks"`
}

type TaskSpec struct {
	Type    string `json:"type"`
	Payload string `json:"payload"`
}

func loadConfig() Config {
	cfg := Config{
		MaxConcurrency: 3,
		MaxRetries:     2,
		Tasks: []TaskSpec{
			{Type: "download", Payload: "https://httpbin.org/get"},
			{Type: "ai", Payload: "Write Web4 article summary"},
			{Type: "blockchain", Payload: "0xContractAddress:mintNFT"},
			{Type: "storage", Payload: "/tmp/sample.txt"},
		},
	}

	if v := os.Getenv("CONFIG_JSON"); v != "" {
		json.Unmarshal([]byte(v), &cfg)
	}
	return cfg
}

// --------------------- TASK ---------------------
type Task struct {
	ID         string // UUID for global uniqueness
	Spec       TaskSpec
	MaxRetries int
}

func (t Task) Run(ctx context.Context) {
	for attempt := 0; attempt <= t.MaxRetries; attempt++ {
		select {
		case <-ctx.Done():
			logTask(t.ID, attempt, "Task canceled")
			return
		default:
		}

		start := time.Now()
		logTask(t.ID, attempt, fmt.Sprintf("Starting task type=%s payload=%s", t.Spec.Type, t.Spec.Payload))
		err := t.execute(ctx)
		duration := time.Since(start).Seconds()

		if err != nil {
			logTask(t.ID, attempt, fmt.Sprintf("Attempt %d failed after %.2fs: %v", attempt, duration, err))
			if attempt < t.MaxRetries {
				backoff := time.Duration(500*int64(1<<attempt)) * time.Millisecond
				time.Sleep(backoff)
			}
			continue
		}

		logTask(t.ID, attempt, fmt.Sprintf("Attempt %d succeeded in %.2fs", attempt, duration))
		break
	}
}

func (t Task) execute(ctx context.Context) error {
	switch t.Spec.Type {
	case "download":
		return taskDownload(ctx, t.Spec.Payload, t.ID)
	case "ai":
		return taskAI(ctx, t.Spec.Payload, t.ID)
	case "blockchain":
		return taskBlockchain(ctx, t.Spec.Payload, t.ID)
	case "storage":
		return taskStorage(ctx, t.Spec.Payload, t.ID)
	default:
		return fmt.Errorf("unknown task type %s", t.Spec.Type)
	}
}

// --------------------- TASK TYPES ---------------------
func taskDownload(ctx context.Context, url, taskID string) error {
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("download failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	// Use task UUID for unique filename
	fileName := fmt.Sprintf("task_download_%s.html", taskID)
	out, err := os.Create(fileName)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func taskAI(ctx context.Context, prompt, taskID string) error {
	select {
	case <-ctx.Done():
		return fmt.Errorf("AI task canceled")
	case <-time.After(500 * time.Millisecond):
	}
	log.Printf("[AI %s] Generated content for prompt: %s", taskID, prompt)
	return nil
}

func taskBlockchain(ctx context.Context, action, taskID string) error {
	select {
	case <-ctx.Done():
		return fmt.Errorf("Blockchain task canceled")
	case <-time.After(300 * time.Millisecond):
	}
	if rand.Float64() < 0.2 {
		return fmt.Errorf("blockchain tx failed")
	}
	log.Printf("[Blockchain %s] Executed action: %s", taskID, action)
	return nil
}

func taskStorage(ctx context.Context, path, taskID string) error {
	select {
	case <-ctx.Done():
		return fmt.Errorf("Storage task canceled")
	case <-time.After(200 * time.Millisecond):
	}
	log.Printf("[Storage %s] Uploaded file: %s", taskID, path)
	return nil
}

// --------------------- LOGGING ---------------------
func logTask(taskID string, attempt int, msg string) {
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

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.MaxConcurrency)

	for _, spec := range cfg.Tasks {
		wg.Add(1)
		sem <- struct{}{}

		// Generate a new UUID per task
		taskID := uuid.New().String()

		go func(ts TaskSpec, tID string) {
			defer wg.Done()
			Task{ID: tID, Spec: ts, MaxRetries: cfg.MaxRetries}.Run(ctx)
			<-sem
		}(spec, taskID)
	}

	wg.Wait()
	log.Println("Web4 Job Runner complete!")
}
