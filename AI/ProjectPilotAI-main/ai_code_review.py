import os
from github import Github
from project_pilot_ai.github_models import ModelClient
from project_pilot_ai.config import get_model_config

def main():
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    REPO_NAME = os.getenv("GITHUB_REPOSITORY")
    PR_NUMBER = int(os.getenv("PR_NUMBER"))

    if not all([GITHUB_TOKEN, REPO_NAME, PR_NUMBER]):
        print("Missing required environment variables.")
        exit(1)

    gh = Github(GITHUB_TOKEN)
    repo = gh.get_repo(REPO_NAME)
    pr = repo.get_pull(PR_NUMBER)

    base_url, model_name = get_model_config("github")
    client = ModelClient(base_url=base_url, model=model_name, token=GITHUB_TOKEN)

    def get_diff_files(pr):
        diffs = {}
        for f in pr.get_files():
            if f.status in ("modified", "added") and f.filename.endswith((".py", ".js", ".ts", ".java")):
                diffs[f.filename] = f.patch
        return diffs

    def create_prompt(filename, diff_text):
        return (
            f"You are an expert code reviewer. Analyze this diff for bugs, security vulnerabilities, and style issues. "
            f"Provide detailed suggestions for improvement. File: {filename}\n\n{diff_text}"
        )

    diffs = get_diff_files(pr)
    comments = []

    for filename, diff in diffs.items():
        prompt = create_prompt(filename, diff)
        response = client.ask([
            {"role": "system", "content": "You are an expert code reviewer."},
            {"role": "user", "content": prompt}
        ])
        comments.append(f"### AI Review for `{filename}`\n\n{response.strip()}")

    comment_body = "\n\n---\n\n".join(comments) if comments else "AI review found no issues. Good job!"

    pr.create_issue_comment(comment_body)
    print("AI review comment posted successfully.")

if __name__ == "__main__":
    main()
