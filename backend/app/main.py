
# FastAPI app factory
from fastapi import FastAPI
from app.api.router import api_router
from app.config import settings

app = FastAPI()


app.include_router(api_router, prefix='/api')