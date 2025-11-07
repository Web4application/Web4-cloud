package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"math/rand"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	shell "github.com/ipfs/go-ipfs-api"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// ---------------- CONFIG ----------------
type PipelineTask struct {
	ID      int            `json:"id"`
	Type    string         `json:"type"`
	Payload string         `json:"payload"`
	Next    []PipelineTask `json:"next,omitempty"`
}

type Config struct {
	MaxConcurrency int            `json:"max_concurrency"`
	MaxRetries     int            `json:"max_retries"`
	Pipeline       []PipelineTask `json:"pipeline"`
}

// Load config from JSON env variable
func loadConfig() Config {
	cfg := Config{
		MaxConcurrency: 3,
		MaxRetries:     2,
		Pipeline:       []PipelineTask{},
	}
	if v := os.Getenv("CONFIG_JSON"); v != "" {
		json.Unmarshal([]byte(v), &cfg)
	}
	return cfg
}

// ---------------- PROMETHEUS METRICS ----------------
var (
	taskSuccess = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "web4_task_success_total", Help: "Successful tasks",
	}, []string{"task_type"})

	taskFailure = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "web4_task_failure_total", Help: "Failed tasks",
	}, []string{"task_type"})
)

func init() {
	prometheus.MustRegister(taskSuccess, taskFailure)
}

// ---------------- TASK REGISTRY ----------------
type TaskFunc func(payload string) (interface{}, error)

var TaskRegistry = map[string]TaskFunc{
	"download":   taskDownload,
	"ai":         taskAI,
	"blockchain": taskBlockchain,
	"storage":    taskStorage,
}

// ---------------- TASK FUNCTIONS ----------------

// Download task
func taskDownload(url string) (interface{}, error) {
	resp, err := http.Get(url)
	if err != nil || resp.StatusCode >= 400 {
		return nil, fmt.Errorf("download failed: %v", err)
	}
	defer resp.Body.Close()

	fileName := fmt.Sprintf("/tmp/download_%d.html", rand.Intn(1000))
	out, err := os.Create(fileName)
	if err != nil {
		return nil, err
	}
	defer out.Close()
	io.Copy(out, resp.Body)
	return fileName, nil
}

// AI task (placeholder, integrate OpenAI or local LLM)
func taskAI(prompt string) (interface{}, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("missing OPENAI_API_KEY")
	}
	time.Sleep(500 * time.Millisecond)
	content := fmt.Sprintf("Generated AI content for prompt: %s", prompt)
	return content, nil
}

// Blockchain task
func taskBlockchain(action string) (interface{}, error) {
	rpc := os.Getenv("ETH_RPC_URL")
	privateKey := os.Getenv("PRIVATE_KEY")
	if rpc == "" || privateKey == "" {
		return nil, fmt.Errorf("missing ETH credentials")
	}
	client, err := ethclient.Dial(rpc)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	// Placeholder for smart contract calls
	time.Sleep(300 * time.Millisecond)
	txHash := fmt.Sprintf("0x%x", rand.Int63())
	return txHash, nil
}

// Storage task (IPFS)
func taskStorage(filePath string) (interface{}, error) {
	sh := shell.NewShell("localhost:5001")
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	cid, err := sh.Add(file)
	if err != nil {
		return nil, err
	}
	return cid, nil
}

// ---------------- PIPELINE EXECUTION ----------------
func runPipelineTask(task PipelineTask, retries int) {
	for attempt := 0; attempt <= retries; attempt++ {
		logTask(task.ID, attempt, fmt.Sprintf("Starting %s", task.Type))
		fn, ok := TaskRegistry[task.Type]
		if !ok {
			logTask(task.ID, attempt, fmt.Sprintf("Unknown task type %s", task.Type))
			taskFailure.WithLabelValues(task.Type).Inc()
			return
		}
		result, err := fn(task.Payload)
		if err != nil {
			logTask(task.ID, attempt, fmt.Sprintf("Failed: %v", err))
			taskFailure.WithLabelValues(task.Type).Inc()
			time.Sleep(time.Duration(500*int64(1<<attempt)) * time.Millisecond)
			continue
		}
		logTask(task.ID, attempt, fmt.Sprintf("Succeeded: %v", result))
		taskSuccess.WithLabelValues(task.Type).Inc()

		// Trigger next tasks
		for _, next := range task.Next {
			go runPipelineTask(next, retries)
		}
		break
	}
}

// ---------------- LOGGING ----------------
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

// ---------------- MAIN ----------------
func main() {
	rand.Seed(time.Now().UnixNano())
	cfg := loadConfig()
	log.Printf("Web4 Autonomous Pipeline Config: %+v", cfg)

	// Start Prometheus metrics endpoint
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		log.Fatal(http.ListenAndServe(":2112", nil))
	}()

	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.MaxConcurrency)

	// Run top-level pipeline tasks
	for _, task := range cfg.Pipeline {
		wg.Add(1)
		sem <- struct{}{}
		go func(t PipelineTask) {
			defer wg.Done()
			runPipelineTask(t, cfg.MaxRetries)
			<-sem
		}(task)
	}

	wg.Wait()
	log.Println("Web4 Autonomous Pipeline complete!")
}
