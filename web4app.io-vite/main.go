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
	"sync/atomic"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	shell "github.com/ipfs/go-ipfs-api"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// ---------------- CONFIG ----------------
type Config struct {
	MaxConcurrency int       `json:"max_concurrency"`
	MaxRetries     int       `json:"max_retries"`
	Tasks          []TaskSpec `json:"tasks"`
}

type TaskSpec struct {
	Type    string `json:"type"`    // "download","ai","blockchain","storage"
	Payload string `json:"payload"` // URL, prompt, contract info, file path
}

func loadConfig() Config {
	cfg := Config{
		MaxConcurrency: 3,
		MaxRetries:     2,
		Tasks: []TaskSpec{
			{Type: "download", Payload: "https://httpbin.org/get"},
			{Type: "ai", Payload: "Generate Web4 article"},
			{Type: "blockchain", Payload: "mintNFT:0xContractAddress"},
			{Type: "storage", Payload: "/tmp/sample.txt"},
		},
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

// ---------------- TASK ----------------
type Task struct {
	ID         int
	Spec       TaskSpec
	MaxRetries int
}

func (t Task) Run() {
	for attempt := 0; attempt <= t.MaxRetries; attempt++ {
		logTask(t.ID, attempt, fmt.Sprintf("Starting %s task", t.Spec.Type))
		err := t.execute()
		if err != nil {
			logTask(t.ID, attempt, fmt.Sprintf("Attempt failed: %v", err))
			taskFailure.WithLabelValues(t.Spec.Type).Inc()
			if attempt < t.MaxRetries {
				time.Sleep(time.Duration(500*int64(1<<attempt)) * time.Millisecond)
			}
			continue
		}
		logTask(t.ID, attempt, "Task succeeded")
		taskSuccess.WithLabelValues(t.Spec.Type).Inc()
		break
	}
}

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

// ---------------- TASK IMPLEMENTATIONS ----------------

// Download task
func taskDownload(url string) error {
	resp, err := http.Get(url)
	if err != nil || resp.StatusCode >= 400 {
		return fmt.Errorf("download failed: %v", err)
	}
	defer resp.Body.Close()

	fileName := fmt.Sprintf("download_%d.html", rand.Intn(1000))
	out, err := os.Create(fileName)
	if err != nil {
		return err
	}
	defer out.Close()
	io.Copy(out, resp.Body)
	return nil
}

// AI/LLM task (placeholder)
func taskAI(prompt string) error {
	time.Sleep(time.Millisecond * 500)
	log.Printf("[AI] Generated content: %s", prompt)
	return nil
}

// Blockchain task
func taskBlockchain(info string) error {
	rpc := os.Getenv("ETH_RPC_URL")
	privateKey := os.Getenv("PRIVATE_KEY")
	if rpc == "" || privateKey == "" {
		return fmt.Errorf("ETH_RPC_URL or PRIVATE_KEY missing")
	}
	client, err := ethclient.Dial(rpc)
	if err != nil {
		return err
	}
	defer client.Close()

	// This is placeholder: real contract calls would require ABI & bindings
	time.Sleep(time.Millisecond * 300)
	log.Printf("[Blockchain] Executed: %s", info)
	return nil
}

// Decentralized storage (IPFS)
func taskStorage(filePath string) error {
	sh := shell.NewShell("localhost:5001")
	cid, err := sh.AddNoPin(nil) // placeholder empty upload
	if err != nil {
		return err
	}
	log.Printf("[Storage] Uploaded file %s to IPFS CID=%s", filePath, cid)
	return nil
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
	log.Printf("Web4 Job Runner Config: %+v", cfg)

	// Start Prometheus metrics
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		log.Fatal(http.ListenAndServe(":2112", nil))
	}()

	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.MaxConcurrency)

	for i, spec := range cfg.Tasks {
		wg.Add(1)
		sem <- struct{}{}
		go func(taskID int, spec TaskSpec) {
			defer wg.Done()
			Task{ID: taskID, Spec: spec, MaxRetries: cfg.MaxRetries}.Run()
			<-sem
		}(i, spec)
	}

	wg.Wait()
	log.Println("Web4 Job Runner complete!")
}
