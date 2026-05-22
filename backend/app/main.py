from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.portfolio import router as portfolio_router
from routes.contact import router as contact_router
from routes.upload import router as upload_router

app = FastAPI(
    title="Portfolio API",
    description="FastAPI backend for Muwafak's Portfolio",
    version="1.0.0"
)

# CORS middleware - allow frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://muwafak-portfolio.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(contact_router)
app.include_router(upload_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "portfolio-api"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Portfolio API is running", "docs": "/docs"}
