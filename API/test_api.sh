#!/bin/bash
# test_api.sh — testa todos os endpoints da API PontuaLattes

BASE="http://localhost:8000"
PASS=0
FAIL=0

# ── helpers ───────────────────────────────────────────────────────────────────

ok()   { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }

check() {
    local label="$1"
    local response="$2"
    local expected="$3"

    if echo "$response" | grep -q "$expected"; then
        ok "$label"
    else
        fail "$label → esperado: '$expected'"
        echo "     resposta: $response"
    fi
}

section() { echo; echo "── $1"; }

# ── testes ────────────────────────────────────────────────────────────────────

section "1. Health check"
R=$(curl -s "$BASE/health")
check "GET /health" "$R" '"status": "ok"'

section "2. Login"
R=$(curl -s -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "pontualattes"}')
check "POST /api/login — credenciais válidas" "$R" '"success": true'

TOKEN=$(echo "$R" | grep -o '"token": "[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    fail "Token não extraído — abortando testes autenticados"
    exit 1
fi
echo "  Token: ${TOKEN:0:20}..."

section "3. Login inválido"
R=$(curl -s -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "errada"}')
check "POST /api/login — senha errada → 401" "$R" '"success": false'

section "4. Busca Lattes — tipo professor (padrão)"
R=$(curl -s -X POST "$BASE/api/lattes" \
  -H "Content-Type: application/json" \
  -d '{"code": "K8981454J6", "tipo": "professor"}')
check "POST /api/lattes professor — coleta realizada"   "$R" '"success": true'
check "POST /api/lattes professor — barema calculado"   "$R" '"Barema calculado com sucesso."'
check "POST /api/lattes professor — tipo correto"       "$R" '"tipo": "professor"'
check "POST /api/lattes professor — nome extraído"      "$R" '"nome":'
check "POST /api/lattes professor — publicações"        "$R" '"publicacoes":'
check "POST /api/lattes professor — total_limitado"     "$R" '"total_limitado":'

section "5. Busca Lattes — tipo AERI com data de ingresso"
R=$(curl -s -X POST "$BASE/api/lattes" \
  -H "Content-Type: application/json" \
  -d '{"code": "K8981454J6", "tipo": "aeri", "data_ingresso": "2022"}')
check "POST /api/lattes aeri — coleta realizada"        "$R" '"success": true'
check "POST /api/lattes aeri — barema calculado"        "$R" '"Barema Lattes calculado com sucesso."'
check "POST /api/lattes aeri — tipo correto"            "$R" '"tipo": "aeri"'
check "POST /api/lattes aeri — edital correto"          "$R" '"02/2025 AERI/UEFS"'
check "POST /api/lattes aeri — ano minimo considerado"  "$R" '"ano_minimo_considerado": 2022'
check "POST /api/lattes aeri — participacao_eventos"    "$R" '"participacao_eventos":'
check "POST /api/lattes aeri — producao_cientifica"     "$R" '"producao_cientifica":'
check "POST /api/lattes aeri — lideranca_estudantil"    "$R" '"lideranca_estudantil":'
check "POST /api/lattes aeri — programas_academicos"    "$R" '"programas_academicos":'
check "POST /api/lattes aeri — aviso lideranca"         "$R" '"aviso":'
check "POST /api/lattes aeri — total_limitado"          "$R" '"total_limitado":'

section "6. Busca Lattes — tipo AERI sem data de ingresso"
R=$(curl -s -X POST "$BASE/api/lattes" \
  -H "Content-Type: application/json" \
  -d '{"code": "K8981454J6", "tipo": "aeri"}')
check "POST /api/lattes aeri sem data — usa últimos 5 anos" "$R" '"success": true'
check "POST /api/lattes aeri sem data — observacao presente" "$R" 'Data de ingresso não informada'

section "7. Busca Lattes — tipo inválido"
R=$(curl -s -X POST "$BASE/api/lattes" \
  -H "Content-Type: application/json" \
  -d '{"code": "K8981454J6", "tipo": "invalido"}')
check "POST /api/lattes — tipo inválido → 400" "$R" '"success": false'

section "8. Busca Lattes — código inválido (número público)"
R=$(curl -s -X POST "$BASE/api/lattes" \
  -H "Content-Type: application/json" \
  -d '{"code": "0254977009739288"}')
check "POST /api/lattes — código inválido → erro" "$R" '"success": false'

section "9. Busca Lattes — sem código"
R=$(curl -s -X POST "$BASE/api/lattes" \
  -H "Content-Type: application/json" \
  -d '{}')
check "POST /api/lattes — sem código → 400" "$R" '"success": false'

section "10. Endpoints autenticados"
R=$(curl -s "$BASE/api/consultas/resumo" -H "Authorization: Bearer $TOKEN")
check "GET /api/consultas/resumo" "$R" '"success": true'

R=$(curl -s "$BASE/api/consultas?page=1&per_page=10" -H "Authorization: Bearer $TOKEN")
check "GET /api/consultas" "$R" '"consultas":'

R=$(curl -s "$BASE/api/consultas/top5" -H "Authorization: Bearer $TOKEN")
check "GET /api/consultas/top5" "$R" '"dados":'

R=$(curl -s "$BASE/api/consultas/dia" -H "Authorization: Bearer $TOKEN")
check "GET /api/consultas/dia" "$R" '"dados":'

section "11. Endpoints autenticados sem token"
R=$(curl -s "$BASE/api/consultas/resumo")
check "GET /api/consultas/resumo sem token → 401" "$R" '"success": false'

section "12. Register bloqueado"
R=$(curl -s -X POST "$BASE/api/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "teste", "password": "123"}')
check "POST /api/register → 403" "$R" '"success": false'

section "13. Logout e invalidação do token"
R=$(curl -s -X POST "$BASE/api/logout" -H "Authorization: Bearer $TOKEN")
check "POST /api/logout" "$R" '"success": true'

R=$(curl -s "$BASE/api/consultas/resumo" -H "Authorization: Bearer $TOKEN")
check "GET /api/consultas/resumo após logout → 401" "$R" '"success": false'

# ── resultado final ───────────────────────────────────────────────────────────

echo
echo "══════════════════════════════"
echo "  Resultado: $PASS ✅  $FAIL ❌"
echo "══════════════════════════════"
echo

[ "$FAIL" -eq 0 ] && exit 0 || exit 1