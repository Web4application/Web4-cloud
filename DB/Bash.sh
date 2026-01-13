#
pip install fastapi uvicorn psycopg2-binary sqlalchemy pydantic bcrypt python-jose

```bash
src/
├─ App.js
├─ pages/
│   ├─ Users.js
│   ├─ Projects.js
│   ├─ Models.js
│   └─ Logs.js


```curl
POST /api/ai/lmlm/analyze
POST /api/ai/gpt5/summarize
POST /api/ai/paperweb/scan
---

```https
GET /api/projects
Authorization: Bearer <token>
