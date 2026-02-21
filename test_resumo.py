import requests
import json
import sys
import io

# Force UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Login
print("Fazendo login...")
login_response = requests.post(
    "http://localhost:3001/api/auth/login",
    json={"email": "teste@shiva.com", "senha": "senha123"}
)

token = login_response.json().get("token")
headers = {"Authorization": f"Bearer {token}"}

# Test /resumo endpoint com período de 30 dias
print("\nTestando /resumo com período de 30 dias...")
dataInicio = '2026-01-22'
dataFim = '2026-02-21'

resumo_response = requests.get(
    f"http://localhost:3001/api/relatorios/resumo?dataInicio={dataInicio}&dataFim={dataFim}",
    headers=headers
)

if resumo_response.status_code != 200:
    print(f"Erro ao chamar /resumo: {resumo_response.text}")
else:
    data = resumo_response.json()
    print("\nRESULTADO DO /resumo:")
    print(json.dumps(data, indent=2, ensure_ascii=False))
