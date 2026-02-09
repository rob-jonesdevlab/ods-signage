FROM python:3.11-slim

# Security: Run as non-root user
RUN useradd -m signage_admin
WORKDIR /home/signage_admin

# Install dependencies (e.g., redis client)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy logic
COPY enrollment_engine.py .

# Operational context
USER signage_admin
CMD ["python", "enrollment_engine.py"]
