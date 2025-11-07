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

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// --------------------- CONFIG ---------------------
type Config struct {
	MaxConcurrency int       `json:"max_concurrency"`
	MaxRetries     int       `json:"max_retries"`
	Tasks          []TaskSpec `json:"tasks"` // dynamic tasks
}

// TaskSpec defines a single task in Web4
type TaskSpec struct {
	Type    string `json:"type"`    // "download", "ai", "blockchain", "storage"
	Payload string `json:"payload"` // URL, AI prompt, contract action, file path
}

// Load config from ENV or defaults
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

// --------------------- METRICS ---------------------
var (
	taskSuccess = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "web4_task_success_total",
			Help: "Number of successfully completed tasks",
		},
		[]string{"task_type"},
	)
	taskFailure = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "web4_task_failure_total",
			Help: "Number of failed tasks",
		},
		[]string{"task_type"},
	)
)

func init() {
	prometheus.MustRegister(taskSuccess, taskFailure)
}

// --------------------- TASK RUNNER ---------------------
type Task struct {
	ID         int
	Spec       TaskSpec
	MaxRetries int
}

func (t Task) Run() {
	for attempt := 0; attempt <= t.MaxRetries; attempt++ {
		logTask(t.ID, attempt, fmt.Sprintf("Starting task type=%s payload=%s", t.Spec.Type, t.Spec.Payload))
		err := t.execute()
		if err != nil {
			logTask(t.ID, attempt, fmt.Sprintf("Attempt %d failed: %v", attempt, err))
			taskFailure.WithLabelValues(t.Spec.Type).Inc()
			if attempt < t.MaxRetries {
				time.Sleep(time.Duration(500*int64(1<<attempt)) * time.Millisecond) // exponential backoff
			}
			continue
		}
		logTask(t.ID, attempt, fmt.Sprintf("Attempt %d succeeded", attempt))
		taskSuccess.WithLabelValues(t.Spec.Type).Inc()
		break
	}
}

// --------------------- TASK TYPES ---------------------
func (t Task) execute() error {
	switch t.Spec.Type {
	case "download":
		return taskDownload(t.Spec.Payload)
	case "ai":
		return taskAI(t.Spec.Payload)
	case "blockchain":
		return taskBlockchain(t.Spec.Payload)
	case "storage":
		return taskStorage(t.Spec.Payload)
	default:
		return fmt.Errorf("unknown task type %s", t.Spec.Type)
	}
}

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

func taskAI(prompt string) error {
	time.Sleep(time.Millisecond * 500)
	log.Printf("[AI] Generated content for prompt: %s", prompt)
	return nil
}

func taskBlockchain(contractAction string) error {
	// Placeholder: integrate Ethereum SDK / Go-Ethereum here
	time.Sleep(time.Millisecond * 300)
	if rand.Float64() < 0.2 {
		return fmt.Errorf("blockchain tx failed")
	}
	log.Printf("[Blockchain] Executed action: %s", contractAction)
	return nil
}

func taskStorage(filePath string) error {
	// Placeholder: integrate IPFS/Arweave SDK here
	time.Sleep(time.Millisecond * 200)
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

	// Prometheus HTTP metrics endpoint
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		log.Fatal(http.ListenAndServe(":2112", nil))
	}()

	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.MaxConcurrency)

	for i, spec := range cfg.Tasks {
		wg.Add(1)
		sem <- struct{}{}
		go func(taskID int, taskSpec TaskSpec) {
			defer wg.Done()
			Task{
				ID:         taskID,
				Spec:       taskSpec,
				MaxRetries: cfg.MaxRetries,
			}.Run()
			<-sem
		}(i, spec)
	}

	wg.Wait()
	log.Println("Web4 Job Runner complete!")
}
