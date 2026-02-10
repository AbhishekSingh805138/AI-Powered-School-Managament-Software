import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
ALGORITHM = os.environ.get('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
