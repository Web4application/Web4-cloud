const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const prometheus = require('prom-client');

// ---------------- METRICS ----------------
const taskSuccess = new prometheus.Counter({
  name: 'regex_task_success_total',
  help: 'Number of successfully passed regex tasks',
  labelNames: ['task_type'],
});

const taskFailure = new prometheus.Counter({
  name: 'regex_task_failure_total',
  help: 'Number of failed regex tasks',
  labelNames: ['task_type'],
});

// Prometheus HTTP metrics endpoint
const http = require('http');
prometheus.collectDefaultMetrics();
http.createServer((req, res) => {
  if (req.url === '/metrics') {
    res.setHeader('Content-Type', prometheus.register.contentType);
    res.end(prometheus.register.metrics());
  } else {
    res.end('Web4 Regex Runner Metrics');
  }
}).listen(2112, () => console.log('Metrics running on http://localhost:2112/metrics'));

// ---------------- LOAD REGEX TASKS ----------------
function parseExpected(expectedStr) {
  // Convert "(0,3)(0,1)(1,2)" → [[0,3],[0,1],[1,2]]
  const matches = expectedStr.match(/\(\d+,\d+\)/g) || [];
  return matches.map(m => {
    const [start, end] = m.slice(1, -1).split(',').map(Number);
    return [start, end];
  });
}

function loadRegexTasks(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const tasks = lines.map((line, i) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) return null;
    const [type, pattern, input, expectedStr] = parts;
    const expected = parseExpected(expectedStr);
    return { id: i + 1, uuid: uuidv4(), type, pattern, input, expected };
  }).filter(Boolean);
  return tasks;
}

// ---------------- RUNNER ----------------
async function runTask(task, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    console.log(`[${task.uuid}] Attempt ${attempt}: testing pattern "${task.pattern}" on "${task.input}"`);
    try {
      const re = new RegExp(task.pattern, 'g');
      const matches = [];
      let match;
      while ((match = re.exec(task.input)) !== null) {
        const groups = [[match.index, match.index + match[0].length]]; // overall match
        for (let i = 1; i < match.length; i++) {
          const gStart = match.index + (match[i] ? task.input.indexOf(match[i], match.index) - match.index : 0);
          const gEnd = gStart + (match[i] ? match[i].length : 0);
          groups.push([gStart, gEnd]);
        }
        matches.push(groups);
        if (re.lastIndex === match.index) re.lastIndex++; // avoid infinite loop
      }

      // Flatten matches for comparison like your .be format
      const flatMatches = matches.flat();

      // Compare with expected
      const expectedStr = JSON.stringify(task.expected);
      const gotStr = JSON.stringify(flatMatches);
      if (expectedStr === gotStr) {
        console.log(`[${task.uuid}] ✅ PASS`);
        taskSuccess.inc({ task_type: task.type });
        return true;
      } else {
        throw new Error(`Mismatch: got ${gotStr}, expected ${expectedStr}`);
      }
    } catch (err) {
      console.log(`[${task.uuid}] ❌ FAIL: ${err.message}`);
      taskFailure.inc({ task_type: task.type });
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
    }
  }
  return false;
}

// ---------------- CONCURRENT EXECUTION ----------------
async function runAllTasks(tasks, maxConcurrency = 5) {
  const sem = [];
  const results = [];

  for (const task of tasks) {
    const p = runTask(task);
    sem.push(p);
    results.push(p);

    if (sem.length >= maxConcurrency) {
      await Promise.race(sem);
      sem.splice(sem.findIndex(s => s.isFulfilled), 1);
    }
  }

  await Promise.all(results);
  console.log('All regex tasks complete!');
}

// ---------------- MAIN ----------------
(async () => {
  const tasks = loadRegexTasks('regex.be');
  console.log(`Loaded ${tasks.length} regex tasks`);
  await runAllTasks(tasks, 5);
})();
