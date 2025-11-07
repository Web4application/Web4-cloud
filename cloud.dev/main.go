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
	"time"

	shell "github.com/ipfs/go-ipfs-api"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// ---------------- CONFIG ----------------
type PipelineTask struct {
	ID      string
	Type    string
	Payload string
	NextGen func(interface{}) []PipelineTask // dynamically generate next tasks
}

type Config struct {
	MaxConcurrency int
	MaxRetries     int
	Pipeline       []PipelineTask
}

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

// AI task (placeholder for real AI integration)
func taskAI(prompt string) (interface{}, error) {
	time.Sleep(500 * time.Millisecond)
	content := fmt.Sprintf("AI generated content for prompt: %s", prompt)
	return content, nil
}

// Blockchain task (placeholder for smart contract call)
func taskBlockchain(action string) (interface{}, error) {
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

// ---------------- DYNAMIC PIPELINE EXECUTION ----------------
func runDynamicTask(task PipelineTask, retries int) {
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

		// Dynamically generate next tasks
		if task.NextGen != nil {
			nextTasks := task.NextGen(result)
			for _, next := range nextTasks {
				go runDynamicTask(next, retries)
			}
		}
		break
	}
}

// ---------------- LOGGING ----------------
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

// ---------------- EXAMPLE DYNAMIC NEXTGEN FUNCTIONS ----------------
func aiNextGen(output interface{}) []PipelineTask {
	txt := output.(string)
	tasks := []PipelineTask{}
	if len(txt) > 0 {
		tasks = append(tasks, PipelineTask{
			ID:      fmt.Sprintf("blockchain-%d", rand.Intn(1000)),
			Type:    "blockchain",
			Payload: "mintNFT:0xContract",
			NextGen: blockchainNextGen,
		})
		tasks = append(tasks, PipelineTask{
			ID:      fmt.Sprintf("storage-%d", rand.Intn(1000)),
			Type:    "storage",
			Payload: "/tmp/content.txt",
		})
	}
	return tasks
}

func blockchainNextGen(output interface{}) []PipelineTask {
	txHash := output.(string)
	// Example: trigger AI analysis after blockchain confirmation
	return []PipelineTask{
		{
			ID:      fmt.Sprintf("ai-followup-%d", rand.Intn(1000)),
			Type:    "ai",
			Payload: fmt.Sprintf("Analyze tx %s", txHash),
			NextGen: aiNextGen,
		},
	}
}

// ---------------- MAIN ----------------
func main() {
	rand.Seed(time.Now().UnixNano())
	cfg := loadConfig()
	log.Printf("Web4 Dynamic Pipeline Config: %+v", cfg)

	// Start Prometheus metrics endpoint
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		log.Fatal(http.ListenAndServe(":2112", nil))
	}()

	var wg sync.WaitGroup
	sem := make(chan struct{}, cfg.MaxConcurrency)

	for _, task := range cfg.Pipeline {
		wg.Add(1)
		sem <- struct{}{}
		go func(t PipelineTask) {
			defer wg.Done()
			runDynamicTask(t, cfg.MaxRetries)
			<-sem
		}(task)
	}

	wg.Wait()
	log.Println("Web4 Dynamic Pipeline complete!")
}
