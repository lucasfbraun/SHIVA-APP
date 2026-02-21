import requests
import json
import sys
import io

# Force UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Login
print("🔐 Fazendo login...")
login_response = requests.post(
    "http://localhost:3001/api/auth/login",
    json={"email": "teste@shiva.com", "senha": "senha123"}
)

if login_response.status_code != 200:
    print(f"❌ Erro no login: {login_response.text}")
    exit(1)

token = login_response.json().get("token")
print(f"✅ Token obtido: {token[:20]}...")

# Test /mensal endpoint
print("\n📊 Testando endpoint /mensal...")
headers = {"Authorization": f"Bearer {token}"}
mensal_response = requests.get(
    "http://localhost:3001/api/relatorios/mensal",
    headers=headers
)

if mensal_response.status_code != 200:
    print(f"❌ Erro ao chamar /mensal: {mensal_response.text}")
    exit(1)

data = mensal_response.json()
print(f"✅ Dados recebidos!")
print(json.dumps(data, indent=2, ensure_ascii=False))

# Check if there's data
has_data = any(d.get("faturamento", 0) > 0 for d in data)
print(f"\n📈 Meses com faturamento: {sum(1 for d in data if d.get('faturamento', 0) > 0)}")
print(f"📉 Meses com despesas: {sum(1 for d in data if d.get('despesas', 0) > 0)}")
