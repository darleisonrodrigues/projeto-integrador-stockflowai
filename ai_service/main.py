import os
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import sqlite3

# Carregar variáveis de ambiente
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Configuração
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DB_PATH = "../backend/stockflow.db" 

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env")

# --- Componentes ---
llm = ChatGroq(
    temperature=0, 
    groq_api_key=GROQ_API_KEY, 
    model_name="llama-3.3-70b-versatile"
)

# Prompts
sql_generation_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert SQLite Data Analyst.
    Tables:
    - products (id, name, barcode, description, quantity, category, expiryDate)
    - suppliers (id, companyName, contactName, phone, email)
    - product_suppliers (productId, supplierId)
    - stock_movements (id, productId, type, quantity, date)
    - orders (id, supplierId, status, date, totalAmount)
    - order_items (id, orderId, productId, quantity, unitPrice)

    Date Format in DB: YYYY-MM-DDTHH:MM:SS.sssZ (ISO8601 string).
    
    Rules:
    1. Return ONLY valid SQLite SQL. No markdown, no explanations.
    2. Use `strftime('%Y-%m-%d', date)` for date comparisons.
    3. Do NOT use trailing commas.
    4. If the user greets (oi, ola, hello), return "GREETING".
    5. If the user asks unrelated questions, return "NOT_SQL".
    6. Products DO NOT have a price column. Prices are in `order_items`.
    7. To link Products to Suppliers, use `product_suppliers` table.
    
    Examples:
    User: "Quantos produtos tenho?"
    SQL: SELECT count(*) FROM products;
    
    User: "Qual produto mais vendido?"
    SQL: SELECT p.name, SUM(sm.quantity) as total FROM stock_movements sm JOIN products p ON sm.productId = p.id WHERE sm.type = 'OUT' GROUP BY p.name ORDER BY total DESC LIMIT 1;

    User: "Pedidos desta semana"
    SQL: SELECT * FROM orders WHERE strftime('%Y-%W', date) = strftime('%Y-%W', 'now');
    
    User: "Qual produto mais entrou essa semana?"
    SQL: SELECT p.name, SUM(sm.quantity) as total FROM stock_movements sm JOIN products p ON sm.productId = p.id WHERE sm.type = 'IN' AND strftime('%Y-%W', sm.date) = strftime('%Y-%W', 'now') GROUP BY p.name ORDER BY total DESC LIMIT 1;
    
    User: "Produtos vencendo"
    SQL: SELECT name, expiryDate FROM products WHERE expiryDate IS NOT NULL AND date(expiryDate) BETWEEN date('now') AND date('now', '+30 days');

    User: "Qual estratégia para o próximo mês?"
    SQL: SELECT p.name, p.quantity, SUM(CASE WHEN sm.type='OUT' THEN sm.quantity ELSE 0 END) as sales_last_month FROM products p LEFT JOIN stock_movements sm ON p.id = sm.productId AND strftime('%Y-%m', sm.date) = strftime('%Y-%m', 'now', '-1 month') GROUP BY p.name ORDER BY sales_last_month DESC LIMIT 10;
    """),
    ("human", "{question}")
])

answer_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful StockFlow AI Assistant.
    - Answer the user's question based on the provided Data.
    - If the user asked for STRATEGY or ADVICE, analyze the data (trends, low stock, high sales) and give actionable business recommendations.
    - Be professional, insightful, and friendly. Answer in Portuguese.
    - If data is empty, say you need more data history to give advice.
    """),
    ("human", "Question: {question}\nData: {data}")
])

# Funções Auxiliares
def clean_sql(sql: str) -> str:
    # Remover markdown / espaços em branco
    sql = sql.replace("```sql", "").replace("```", "").strip()
    
    # Pegar apenas a primeira instrução se múltiplas forem geradas
    if ";" in sql:
        sql = sql.split(";")[0]

    # Corrigir erros comuns de sintaxe SQLite via Regex
    # 1. Vírgula sobrando antes do FROM (ex: "SELECT a, b, FROM")
    sql = re.sub(r',\s*FROM', ' FROM', sql, flags=re.IGNORECASE)
    
    # 2. Limit 1 no final se for select guloso padrão (opcional, mas bom para segurança)
    # Adicionar limit apenas se não for count/sum
    if "SELECT *" in sql.upper() and not "LIMIT" in sql.upper():
         sql += " LIMIT 50"
        
    return sql

def execute_sql(query: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(query)
        columns = [description[0] for description in cursor.description]
        data = cursor.fetchall()
        conn.close()
        return [dict(zip(columns, row)) for row in data]
    except Exception as e:
        return f"Error: {e}"

# --- API ---
class QueryRequest(BaseModel):
    query: str

@app.post("/analyze")
async def analyze(request: QueryRequest):
    try:
        # Passo 1: Gerar SQL
        chain_sql = sql_generation_prompt | llm
        sql_response = chain_sql.invoke({"question": request.query})
        
        # Limpar SQL
        raw_sql = sql_response.content
        sql_query = clean_sql(raw_sql)
        
        print(f"Original SQL: {raw_sql}")
        print(f"Cleaned SQL: {sql_query}")

        if "NOT_SQL" in sql_query:
            return {"result": "Desculpe, só posso responder perguntas sobre seus dados de estoque."}
            
        if "GREETING" in sql_query.upper():
            return {"result": "Olá! Sou sua IA de Estoque. Pergunte algo como: 'Qual produto tem menos estoque?' ou 'Quanto vendi hoje?'."}

        # Passo 2: Executar SQL
        data = execute_sql(sql_query)
        
        if isinstance(data, str) and "Error" in data:
             # Fallback: Tentar mais uma vez ou apenas reportar erro
             return {"result": f"Desculpe, tive um erro técnico ao consultar o banco: {data}"}
        
        # Passo 3: Gerar Resposta
        chain_answer = answer_prompt | llm
        final_response = chain_answer.invoke({"question": request.query, "data": str(data)})
        
        return {"result": final_response.content}

    except Exception as e:
        print(f"Error: {e}")
        return {"result": f"Erro ao processar sua solicitação: {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "AI Service is running (Robust Mode)"}

