#!/usr/bin/env python3
"""
Test script to verify quantidadeRefCalculo field is properly saved and retrieved
"""

import requests
import json

BASE_URL = "http://localhost:3001"
auth_token = None

def get_auth_token():
    """Get authentication token"""
    global auth_token
    print("\n=== Getting Authentication Token ===")
    
    login_data = {
        'email': 'teste@shiva.com',
        'senha': 'senha123'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            auth_token = result.get('token')
            if auth_token:
                print(f"✅ Token obtido com sucesso")
                return auth_token
            else:
                print(f"❌ Nenhum token na resposta")
                return None
        else:
            print(f"❌ Erro no login: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return None

def test_create_product_with_quantity():
    """Test creating a product with quantidadeRefCalculo"""
    print("\n=== Testing Product Creation with quantidadeRefCalculo ===")
    
    if not auth_token:
        print("❌ Sem token de autenticação")
        return None
    
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Test with G (100), ML (100), KG (1), UN (1), L (1)
    test_cases = [
        ('Teste G', 'G', '100'),
        ('Teste ML', 'ML', '100'),
        ('Teste KG', 'KG', '1'),
    ]
    
    for nome, unidade, quantidade_esperada in test_cases:
        data = {
            'nome': nome,
            'descricao': f'Teste com {unidade}',
            'precoVenda': '99.90',
            'custoMedio': '50.00',
            'unidadeMedida': unidade,
            'quantidadeRefCalculo': quantidade_esperada,
            'ativo': 'true',
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/produtos", data=data, headers=headers)
            
            if response.status_code == 201:
                produto = response.json()
                print(f"\n✅ {nome} criado com sucesso!")
                print(f"   Unidade: {produto.get('unidadeMedida')}")
                print(f"   Quantidade Ref: {produto.get('quantidadeRefCalculo')}")
                
                if float(produto.get('quantidadeRefCalculo', 0)) == float(quantidade_esperada):
                    print(f"   ✅ [PASS] quantidadeRefCalculo={quantidade_esperada} correto")
                else:
                    print(f"   ❌ [FAIL] Expected {quantidade_esperada}, got {produto.get('quantidadeRefCalculo')}")
            else:
                print(f"❌ Erro ao criar {nome}: {response.text}")
        except Exception as e:
            print(f"❌ Erro na requisição: {e}")

if __name__ == '__main__':
    print("🧪 Testing quantidadeRefCalculo Feature")
    print("=" * 50)
    
    if not get_auth_token():
        print("❌ Falha ao obter token. Abortando testes.")
        exit(1)
    
    test_create_product_with_quantity()
    
    print("\n" + "=" * 50)
    print("✅ Tests completed!")
