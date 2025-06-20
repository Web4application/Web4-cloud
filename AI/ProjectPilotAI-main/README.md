# ProjectPilotAI

**Automated AI-Powered Project Management & Code Intelligence**

---

## Overview

ProjectPilotAI is a cutting-edge AI automation framework designed to transform how software projects are managed, analyzed, and maintained. It leverages state-of-the-art large language models (LLMs) to extract actionable tasks from meeting transcripts, analyze repository health, and automate GitHub issue tracking — all seamlessly orchestrated to turbocharge your development workflow.

Built with modularity and scalability in mind, ProjectPilotAI integrates easily as a standalone toolkit or within broader AI platforms such as **RODAAI** and **Script Analyzer Bot**.

---

## Features

- **Task Extraction from Meeting Transcripts**  
  Converts raw meeting transcripts into structured action items with owners and deadlines, powered by OpenAI GPT-4.

- **Repository Structure Analysis**  
  Automatically audits project directories to identify missing essentials and improvement opportunities.

- **GitHub Issue Automation**  
  Creates GitHub issues based on extracted tasks, intelligently assigning owners and managing missing info.

- **Workflow Orchestration**  
  Seamlessly connects task extraction, repo analysis, and GitHub automation into a unified, easy-to-use pipeline.

- **API Integration**  
  FastAPI-based endpoint to plug ProjectPilotAI into your existing backend systems.

---

## Installation

```bash
git clone https://github.com/Web4application/ProjectPilotAI.git
cd ProjectPilotAI
pip install -r requirements.txt
````

---

## Environment Setup

Set the following environment variables:

* `OPENAI_API_KEY` — Your OpenAI API key for GPT-4 access.
* `GITHUB_TOKEN` — Personal access token for GitHub API.
* `GITHUB_REPO` — Target repository full name (e.g. `username/repo`).

---

## Usage

### As a standalone module

Import and use the main components:

```python
from project_pilot_ai.task_extractor import TaskExtractor
from project_pilot_ai.repo_analyzer import RepoAnalyzer
from project_pilot_ai.github_agent import GitHubAgent
from project_pilot_ai.workflow_orchestrator import WorkflowOrchestrator

transcript = "...your meeting transcript here..."

extractor = TaskExtractor()
analyzer = RepoAnalyzer(base_path=".")
github_agent = GitHubAgent()

orchestrator = WorkflowOrchestrator(extractor, analyzer, github_agent)
result = orchestrator.run(transcript)

print(result)
```

### API Endpoint

Run the FastAPI server:

```bash
uvicorn api.routes:app --reload
```

POST to `/analyze-transcript/` with JSON:

```json
{
  "transcript": "Your meeting transcript text here"
}
```

Response will contain extracted tasks, repo analysis, and created GitHub issues.

---

## Integration Tips

* Add `ProjectPilotAI` as a **git submodule** in your existing repos (`RODAAI`, `Script Analyzer Bot`) for seamless integration.
* Use the provided API routes or import Python modules directly.
* Automate task extraction and issue creation workflows with scheduled jobs or webhooks.

---

## Roadmap & Vision

We envision ProjectPilotAI as the **central nervous system** for AI-driven software project automation — bridging natural language understanding with practical codebase insight and developer workflow orchestration.

Future expansions include:

* Deep code review and suggestion AI.
* Integration with multiple project management platforms.
* Advanced meeting summarization and contextual AI assistants.

---

## Contributing

We welcome contributions! Please follow standard GitHub workflow:

1. Fork the repo
2. Create a feature branch
3. Submit pull requests with clear descriptions

---

## License

MIT License

---

## Contact

Developed and maintained by Kubu Lee — AI developer pushing the boundaries of project automation.
GitHub: [Web4application](https://github.com/Web4application)

---
**ProjectPilotAI — Pilot your projects with AI-powered precision.
