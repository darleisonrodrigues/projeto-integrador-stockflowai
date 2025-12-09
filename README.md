# StockFlow AI 📦🤖

> **Projeto Integrador | Faculdade GRAN**
> Sistema Inteligente de Gestão de Estoque com Assistente de IA Integrado.

![Status do Projeto](https://img.shields.io/badge/Status-Concluído-brightgreen)
![Segurança](https://img.shields.io/badge/Security-OWASP_Hardened-blue)
![Stack](https://img.shields.io/badge/Stack-React_Node_Python-orange)

## 📋 Sobre o Projeto

O **StockFlow AI** é uma solução moderna para controle de estoque que vai além do CRUD tradicional. Ele integra um **Assistente de Inteligência Artificial** (baseado em Llama 3 via Groq) que permite aos gestores consultarem dados do negócio usando linguagem natural (ex: *"Qual produto vendeu mais essa semana?"*).

O sistema foi desenhado com foco em usabilidade (UX), performance e segurança da informação, seguindo padrões de mercado.

### 🌟 Destaques
*   **Gestão Completa**: Produtos, Fornecedores, Clientes, Pedidos de Compra e Vendas.
*   **IA Generativa**: Chatbot integrado para análise de dados e insights estratégicos.
*   **Segurança (OWASP)**: Implementação de Rate Limiting, Filtros de Upload, Proteção XSS e Headers de Segurança.
*   **Design Premium**: Interface responsiva construída com TailwindCSS e suporte a Dark Mode.

---

## 🏗️ Arquitetura do Sistema

O projeto utiliza uma arquitetura de microsserviços simplificada para facilitar a manutenção e escalabilidade:

1.  **Frontend (Client)**:
    *   **React + TypeScript + Vite**: Para uma SPA (Single Page Application) rápida e tipada.
    *   **TailwindCSS**: Para estilização moderna.
    *   **Google OAuth**: Para autenticação segura.

2.  **Backend (API Principal)**:
    *   **Node.js + Express**: Gerencia a lógica de negócios e autenticação.
    *   **SQLite**: Banco de dados relacional (SQL) leve e eficiente para o escopo.
    *   **Segurança**: Middleware `helmet`, `express-rate-limit` e `express-validator`.

3.  **AI Service (Analytics)**:
    *   **Python + FastAPI**: Microsserviço dedicado para processamento de linguagem natural.
    *   **LangChain + Groq (Llama 3)**: Transforma perguntas em queries SQL seguras para responder o usuário.

---

## 🚀 Funcionalidades Detalhadas

*   **📦 Produtos**: Cadastro com upload de imagens, controle de validade e alertas de estoque baixo.
*   **🚚 Fornecedores**: Gestão de parceiros e histórico de pedidos.
*   **🛒 Movimentações**: Registro automático de entradas (Compras) e saídas (Vendas).
*   **📊 Dashboard**: Indicadores visuais de faturamento e itens críticos.
*   **🤖 Chat IA**: Pergunte ao sistema sobre seus dados e receba respostas precisas em português.
*   **🔒 Admin**: Controle de usuários e configurações do sistema.

---

## 🛠️ Tecnologias

| Área | Tecnologias |
|------|-------------|
| **Frontend** | React 18, TypeScript, TailwindCSS, Recharts, React Router DOM |
| **Backend** | Node.js, Express, SQLite3, JWT, Multer, Crypto |
| **AI / Data** | Python 3.10+, FastAPI, LangChain, Groq API |
| **DevOps** | Git, npm, pip |

---

## ⚙️ Instalação e Execução

Siga os passos abaixo para rodar o projeto localmente.

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (v18 ou superior)
*   [Python](https://www.python.org/) (v3.10 ou superior)
*   Chave de API da **Groq Cloud** (Gratuita para testes)
*   Credenciais do **Google Cloud Console** (Para login Social)

### 1. Configurando o Backend (Node.js)

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend/` com o seguinte conteúdo:
```env
PORT=3000
JWT_SECRET=SuaChaveSecretaAqui
FRONTEND_URL=http://localhost:5173
```

Inicie o servidor:
```bash
npm run dev
# O servidor rodará em http://localhost:3000
# Documentação Swagger disponível em: http://localhost:3000/api-docs
```

### 2. Configurando o Serviço de IA (Python)

```bash
cd ai_service
# Cria o ambiente virtual (Recomendado)
python -m venv venv
# Ativa o venv (Windows)
.\venv\Scripts\activate
# Instala dependências
pip install -r requirements.txt
```

Crie um arquivo `.env` na pasta `ai_service/` com sua chave:
```env
GROQ_API_KEY=sua_chave_da_groq_aqui
```

Inicie o serviço:
```bash
uvicorn main:app --reload
# O serviço rodará em http://localhost:8000
```

### 3. Configurando o Frontend (React)

```bash
cd .. # Volte para a raiz se estiver em ai_service
npm install
```

Edite o arquivo `vite.config.ts` (ou crie um `.env` local) se precisar ajustar as chaves do Google, mas o padrão já deve funcionar para desenvolvimento local se as origens estiverem permitidas no Google Cloud.

Inicie a aplicação:
```bash
npm run dev
# Acesse http://localhost:5173
```

---

## 🛡️ Segurança Implementada

Para garantir a integridade do sistema, foram aplicadas as melhores práticas da **OWASP**:

1.  **Proteção contra Injeção SQL**: Uso de *Parameterized Queries* no Node.js e validação de output na IA.
2.  **Rate Limiting**: Bloqueio de IPs que fazem muitas requisições em curto período (Prevenção DoS).
3.  **Sanitização de Dados**: Validação estrita de todos os inputs (CPF, CNPJ, Email, Tipos numéricos).
4.  **Uploads Seguros**: Filtro de extensão e MIME type para aceitar apenas imagens válidas.
5.  **Headers HTTP**: Uso do `Helmet` para ofuscar tecnologias do servidor.

---

## 📝 Autor

Desenvolvido por **Darleison** para a disciplina de Projeto Integrador.
*Faculdade GRAN - 2025*
