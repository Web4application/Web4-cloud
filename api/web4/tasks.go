type Task struct {
  ID     string `json:"id"`
  Type   string `json:"type"`   // AI, Blockchain, IPFS, etc.
  Status string `json:"status"` // pending, success, failed
  Log    string `json:"log"`
}

func tasksHandler(w http.ResponseWriter, r *http.Request) {
  tasks := []Task{
    {"task-001", "AI", "success", "Generated content A"},
    {"task-002", "Blockchain", "pending", "Writing to chain..."},
    {"task-003", "IPFS", "failed", "Upload failed: timeout"},
  }
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(tasks)
}
