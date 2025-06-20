from api.routes import project_pilot

app.include_router(project_pilot.router, prefix="/api")
