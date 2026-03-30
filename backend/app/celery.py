from celery import Celery
from app.redis_client import REDIS_URL
import ssl

celery_app = Celery(
    "repomind",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

# Redis SSL (Upstash)
celery_app.conf.broker_use_ssl = {
    "ssl_cert_reqs": ssl.CERT_NONE
}

celery_app.conf.redis_backend_use_ssl = {
    "ssl_cert_reqs": ssl.CERT_NONE
}

# 🚨 MVP MODE (NO WORKER)
celery_app.conf.update(
    task_always_eager=True,
    task_eager_propagates=True,
)

celery_app.autodiscover_tasks(["app.tasks"])
