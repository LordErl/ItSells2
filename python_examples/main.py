from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from mercadopago_routes import mp_router
from webhooks import webhook_router
from cora_routes import  router as cora_router 
from cora_api import router as cora_api_router
from manual_routes import manual_router
import logging



# Configuração básica de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Criação da aplicação

app = FastAPI(title="API de Cobrança Cora")

app.include_router(cora_router)


# Definição das origens permitidas
origins = [
    "https://tonodesafio.vercel.app",
    "http://localhost:3000",
    # Adicione outros domínios permitidos aqui, se necessário
]

# Aplicação do middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # ou ["*"] para testes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão das rotas
app.include_router(mp_router, prefix="/mercadopago")
app.include_router(cora_router, prefix="/cora")
app.include_router(cora_api_router, prefix="/cora/api")
app.include_router(manual_router, prefix="/pagamento")
app.include_router(webhook_router, prefix="/webhook")

# Manipulador personalizado para erros de validação
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        # Tenta extrair o corpo da requisição como JSON
        body = await request.json()
    except Exception:
        # Se falhar, tenta extrair como texto
        body_bytes = await request.body()
        body = body_bytes.decode('utf-8')

    # Registra o corpo da requisição e os erros de validação
    logger.error(f"Erro de validação na requisição: {request.url}")
    logger.error(f"Corpo da requisição: {body}")
    logger.error(f"Detalhes do erro: {exc.errors()}")

    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": body}
    )
