import httpx
from config import SUPABASE_URL, SUPABASE_KEY

async def confirmar_pagamento_supabase(referencia_externa: str):
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }

        # Example: Update a 'pagamentos_supabase' table
        data = {
            "status": "confirmed"
        }

        url = f"{SUPABASE_URL}/rest/v1/pagamentos_supabase?referencia_externa=eq.{referencia_externa}"

        async with httpx.AsyncClient() as client:
            response = await client.patch(url, headers=headers, json=data)

        return response.status_code, response.json()
    except Exception as e:
        return 500, {"error": str(e)}