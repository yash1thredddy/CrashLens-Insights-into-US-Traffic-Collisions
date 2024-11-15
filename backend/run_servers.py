# backend/run_servers.py
import subprocess
import sys
from threading import Thread

def run_flask():
    subprocess.run([sys.executable, "run.py"])

def run_fastapi():
    subprocess.run([sys.executable, "-m", "uvicorn", "fast_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])

if __name__ == "__main__":
    flask_thread = Thread(target=run_flask)
    fastapi_thread = Thread(target=run_fastapi)

    flask_thread.start()
    fastapi_thread.start()

    flask_thread.join()
    fastapi_thread.join()