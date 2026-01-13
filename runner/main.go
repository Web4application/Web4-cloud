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
	ID         int
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
		return taskDownload(ctx, t.Spec.Payload)
	case "ai":
		return taskAI(ctx, t.Spec.Payload)
	case "blockchain":
		return taskBlockchain(ctx, t.Spec.Payload)
	case "storage":
		return taskStorage(ctx, t.Spec.Payload)
	default:
		return fmt.Errorf("unknown task type %s", t.Spec.Type)
	}
}

// --------------------- TASK TYPES ---------------------
func taskDownload(ctx context.Context, url string) error {
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("download failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	fileName := fmt.Sprintf("task_download_%d.html", time.Now().UnixNano())
	out, err := os.Create(fileName)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func taskAI(ctx context.Context, prompt string) error {
	select {
	case <-ctx.Done():
		return fmt.Errorf("AI task canceled")
	case <-time.After(500 * time.Millisecond):
	}
	log.Printf("[AI] Generated content for prompt: %s", prompt)
	return nil
}

func taskBlockchain(ctx context.Context, action string) error {
	select {
	case <-ctx.Done():
		return fmt.Errorf("Blockchain task canceled")
	case <-time.After(300 * time.Millisecond):
	}
	if rand.Float64() < 0.2 {
		return fmt.Errorf("blockchain tx failed")
	}
	log.Printf("[Blockchain] Executed action: %s", action)
	return nil
}

func taskStorage(ctx context.Context, path string) error {
	select {
	case <-ctx.Done():
		return fmt.Errorf("Storage task canceled")
	case <-time.After(200 * time.Millisecond):
	}
	log.Printf("[Storage] Uploaded file: %s", path)
	return nil
}

// --------------------- LOGGING ---------------------
func logTask(taskID, attempt int, msg string) {
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

	for i, spec := range cfg.Tasks {
		wg.Add(1)
		sem <- struct{}{}
		go func(taskID int, ts TaskSpec) {
			defer wg.Done()
			Task{ID: taskID, Spec: ts, MaxRetries: cfg.MaxRetries}.Run(ctx)
			<-sem
		}(i, spec)
	}

	wg.Wait()
	log.Println("Web4 Job Runner complete!")
}
