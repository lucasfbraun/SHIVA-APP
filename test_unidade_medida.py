#!/usr/bin/env python3
"""
Test script to verify unidadeMedida field is properly saved and retrieved
"""

import requests
import json

BASE_URL = "http://localhost:3001"
auth_token = None

def get_auth_token():
    """Get authentication token"""
    global auth_token
    print("\n=== Getting Authentication Token ===")
    
    # Try to login with default credentials
    login_data = {
        'email': 'teste@shiva.com',
        'senha': 'senha123'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            auth_token = result.get('token')
            if auth_token:
                print(f"✅ Token obtido com sucesso")
                return auth_token
            else:
                print(f"❌ Nenhum token na resposta: {result}")
                return None
        else:
            print(f"❌ Erro no login: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return None

def test_create_product_with_unit():
    """Test creating a product with unidadeMedida"""
    print("\n=== Testing Product Creation with unidadeMedida ===")
    
    if not auth_token:
        print("❌ Sem token de autenticação")
        return None
    
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Create a test product with unit of measurement
    data = {
        'nome': 'Produto Teste Unidade',
        'descricao': 'Teste unitário para verificar unidadeMedida',
        'categoria': 'Testes',
        'precoVenda': '99.90',
        'custoMedio': '50.00',
        'markup': '0',
        'tipo': 'COMPRADO',
        'ativo': 'true',
        'controlaEstoque': 'true',
        'unidadeMedida': 'KG'  # Test with KG
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/produtos", data=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201 or response.status_code == 200:
            produto = response.json()
            print(f"✅ Produto criado com sucesso!")
            print(f"ID: {produto.get('id')}")
            print(f"Nome: {produto.get('nome')}")
            print(f"Unidade de Medida: {produto.get('unidadeMedida')}")
            
            # Verify unidadeMedida was saved
            if produto.get('unidadeMedida') == 'KG':
                print("✅ [PASS] unidadeMedida 'KG' foi salvo corretamente")
                return produto['id']
            else:
                print(f"❌ [FAIL] Expected unidadeMedida='KG', got '{produto.get('unidadeMedida')}'")
                return None
        else:
            print(f"❌ Erro ao criar produto: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return None

def test_get_product(product_id):
    """Test retrieving a product and verify unidadeMedida"""
    if not product_id:
        return False
    
    if not auth_token:
        print("❌ Sem token de autenticação")
        return False
        
    print("\n=== Testing Product Retrieval ===")
    
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    try:
        response = requests.get(f"{BASE_URL}/api/produtos/{product_id}", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            produto = response.json()
            print(f"✅ Produto recuperado com sucesso!")
            print(f"Unidade de Medida: {produto.get('unidadeMedida')}")
            
            if produto.get('unidadeMedida') == 'KG':
                print("✅ [PASS] unidadeMedida persistiu corretamente no banco de dados")
                return True
            else:
                print(f"❌ [FAIL] Expected unidadeMedida='KG', got '{produto.get('unidadeMedida')}'")
                return False
        else:
            print(f"❌ Erro ao recuperar produto: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

def test_update_product(product_id):
    """Test updating a product's unidadeMedida"""
    if not product_id:
        return False
    
    if not auth_token:
        print("❌ Sem token de autenticação")
        return False
        
    print("\n=== Testing Product Update ===")
    
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    data = {
        'nome': 'Produto Teste Unidade',
        'unidadeMedida': 'ML'  # Change from KG to ML
    }
    
    try:
        response = requests.put(f"{BASE_URL}/api/produtos/{product_id}", data=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            produto = response.json()
            print(f"✅ Produto atualizado com sucesso!")
            print(f"Nova Unidade de Medida: {produto.get('unidadeMedida')}")
            
            if produto.get('unidadeMedida') == 'ML':
                print("✅ [PASS] unidadeMedida foi atualizado para 'ML' corretamente")
                return True
            else:
                print(f"❌ [FAIL] Expected unidadeMedida='ML', got '{produto.get('unidadeMedida')}'")
                return False
        else:
            print(f"❌ Erro ao atualizar produto: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Testing unidadeMedida Feature")
    print("=" * 50)
    
    # Get authentication token first
    if not get_auth_token():
        print("❌ Falha ao obter token de autenticação. Abortando testes.")
        exit(1)
    
    # Test 1: Create product with unit
    product_id = test_create_product_with_unit()
    
    # Test 2: Retrieve and verify
    if product_id:
        test_get_product(product_id)
        
        # Test 3: Update unit
        test_update_product(product_id)
    
    print("\n" + "=" * 50)
    print("✅ Tests completed!")
