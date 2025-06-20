from fastapi import APIRouter, Request
from apps.project_pilot_ai.task_extractor import TaskExtractor
from apps.project_pilot_ai.repo_analyzer import RepoAnalyzer
from apps.project_pilot_ai.github_agent import GitHubAgent
from apps.project_pilot_ai.workflow_orchestrator import WorkflowOrchestrator

router = APIRouter()

@router.post("/project-pilot/analyze/")
async def analyze_transcript(request: Request):
    data = await request.json()
    transcript = data.get("transcript", "")

    extractor = TaskExtractor()
    analyzer = RepoAnalyzer(base_path=".")
    github_agent = GitHubAgent()

    orchestrator = WorkflowOrchestrator(extractor, analyzer, github_agent)
    result = orchestrator.run(transcript)

    return result
