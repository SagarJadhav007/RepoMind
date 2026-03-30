FROM python:3.11-slim

WORKDIR /app

# Install system deps (optional but useful)
RUN apt-get update && apt-get install -y build-essential

# Copy requirements first (cache optimization)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy rest of code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]