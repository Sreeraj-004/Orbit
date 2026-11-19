from fastapi import FastAPI

from database import initialize_database
from routers.commands import router as commands_router

from fastapi.middleware.cors import CORSMiddleware
from routers.agents import router as agents_router

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)




app = FastAPI(
    title="Orbit Server",
    description="Central server for managing browser agents",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(agents_router)


initialize_database()

app.include_router(commands_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Orbit",
        "status": "running"
    }