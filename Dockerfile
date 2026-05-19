# Use an official Python runtime as a parent image (slim for smaller size)
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies (often needed for cryptography/boto3 in slim images)
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first (for better Docker layer caching)
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /app/

# Expose the port (assuming FastAPI default)
EXPOSE 8000

# Start the server (adjust if the entrypoint is different)
CMD ["python", "backend/server.py"]
