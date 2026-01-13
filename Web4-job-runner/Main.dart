import 'dart:io';
import 'dart:math';
import 'dart:async';
import 'package:uuid/uuid.dart';

var uuid = Uuid();
var random = Random();

void main() async {
  // Example tasks
  var tasks = [
    {"type": "download", "payload": "https://httpbin.org/get"},
    {"type": "ai", "payload": "Write a Web4 article summary"},
    {"type": "blockchain", "payload": "mintNFT"},
    {"type": "storage", "payload": "/tmp/sample.txt"},
    {"type": "download", "payload": "https://httpbin.org/anything"},
  ];

  int maxConcurrency = 3;
  var semaphore = Semaphore(maxConcurrency);

  // Run all tasks concurrently with maxConcurrency limit
  var futures = tasks.map((task) async {
    await semaphore.acquire();
    try {
      var taskId = uuid.v4();
      await runTask(taskId, task);
    } finally {
      semaphore.release();
    }
  }).toList();

  await Future.wait(futures);
  print("All tasks complete!");
}

// ----------------- Concurrency control -----------------
class Semaphore {
  int _maxConcurrent;
  int _current = 0;
  final _queue = <Completer>[];

  Semaphore(this._maxConcurrent);

  Future<void> acquire() {
    if (_current < _maxConcurrent) {
      _current++;
      return Future.value();
    }
    var completer = Completer<void>();
    _queue.add(completer);
    return completer.future;
  }

  void release() {
    if (_queue.isNotEmpty) {
      _queue.removeAt(0).complete();
    } else {
      _current--;
    }
  }
}

// ----------------- Task runner -----------------
Future<void> runTask(String taskId, Map task) async {
  print("[$taskId] Starting ${task['type']} task...");

  switch (task['type']) {
    case "download":
      await taskDownload(taskId, task['payload']);
      break;
    case "ai":
      await taskAI(taskId, task['payload']);
      break;
    case "blockchain":
      await taskBlockchain(taskId, task['payload']);
      break;
    case "storage":
      await taskStorage(taskId, task['payload']);
      break;
    default:
      print("[$taskId] Unknown task type: ${task['type']}");
  }

  print("[$taskId] Task complete!\n");
}

// ----------------- Task implementations -----------------
Future<void> taskDownload(String taskId, String url) async {
  await Future.delayed(Duration(milliseconds: 500 + random.nextInt(500)));
  var fileName = "download_$taskId.html";
  File(fileName).writeAsStringSync("<html><body>Downloaded from $url</body></html>");
  print("[$taskId] Download saved as $fileName");
}

Future<void> taskAI(String taskId, String prompt) async {
  await Future.delayed(Duration(milliseconds: 500));
  print("[$taskId] AI generated content for prompt: $prompt");
}

Future<void> taskBlockchain(String taskId, String action) async {
  await Future.delayed(Duration(milliseconds: 300));
  if (random.nextDouble() < 0.2) {
    print("[$taskId] Blockchain action $action failed!");
    return;
  }
  print("[$taskId] Blockchain action $action succeeded!");
}

Future<void> taskStorage(String taskId, String path) async {
  await Future.delayed(Duration(milliseconds: 200));
  print("[$taskId] File $path uploaded to storage");
}
