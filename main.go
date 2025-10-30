package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Job-defined
	TaskNum    string
	AttemptNum string

	// User-defined
	SleepMs  int64
	FailRate float64
}

// Load configuration from environment variables
func configFromEnv() (Config, error) {
	// Job-defined
	taskNum := os.Getenv("CLOUD_RUN_TASK_INDEX")
	attemptNum := os.Getenv("CLOUD_RUN_TASK_ATTEMPT")

	// User-defined
	sleepMs, err := sleepMsToInt(os.Getenv("SLEEP_MS"))
	if err != nil {
		return Config{}, fmt.Errorf("invalid SLEEP_MS: %v", err)
	}

	failRate, err := failRateToFloat(os.Getenv("FAIL_RATE"))
	if err != nil {
		return Config{}, fmt.Errorf("invalid FAIL_RATE: %v", err)
	}

	config := Config{
		TaskNum:    taskNum,
		AttemptNum: attemptNum,
		SleepMs:    sleepMs,
		FailRate:   failRate,
	}

	return config, nil
}

// Convert sleepMs string to int64, default to 0
func sleepMsToInt(s string) (int64, error) {
	if s == "" {
		return 0, nil
	}
	return strconv.ParseInt(s, 10, 64)
}

// Convert failRate string to float64, must be between 0 and 1
func failRateToFloat(s string) (float64, error) {
	if s == "" {
		return 0, nil
	}
	failRate, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, err
	}
	if failRate < 0 || failRate > 1 {
		return failRate, fmt.Errorf("FAIL_RATE must be between 0 and 1 inclusive, got %f", failRate)
	}
	if failRate == 1 {
		log.Println("Warning: FAIL_RATE is 1.0, this task will always fail")
	}
	return failRate, nil
}

func main() {
	// Seed the random number generator once
	rand.Seed(time.Now().UnixNano())

	// Load configuration
	config, err := configFromEnv()
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("task=%s attempt=%s msg=%s", config.TaskNum, config.AttemptNum, "Starting task")

	// Simulate work
	if config.SleepMs > 0 {
		time.Sleep(time.Duration(config.SleepMs) * time.Millisecond)
	}

	// Simulate random failure
	if config.FailRate > 0 {
		if err := randomFailure(config); err != nil {
			log.Fatalf("task=%s attempt=%s error=%v", config.TaskNum, config.AttemptNum, err)
		}
	}

	log.Printf("task=%s attempt=%s msg=%s", config.TaskNum, config.AttemptNum, "Completed task")
}

// Return an error randomly based on fail rate
func randomFailure(config Config) error {
	randomValue := rand.Float64()
	if randomValue < config.FailRate {
		return fmt.Errorf("Task failed randomly (failRate=%.2f)", config.FailRate)
	}
	return nil
}
