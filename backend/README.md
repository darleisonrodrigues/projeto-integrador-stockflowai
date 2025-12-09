# Documentação da API - StockFlow AI 📡

Este documento detalha os endpoints, métodos de autenticação e formatos de resposta da API do Backend (Node.js/Express).

> 📘 **Documentação Interativa (Swagger)**
>
> Com o servidor rodando, acesse a interface visual para testar os endpoints:
> 👉 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## 🔒 Autenticação

A API utiliza **JWT (JSON Web Token)** para proteger rotas.
O token deve ser enviado no Header de todas as requisições protegidas.

**Header:**
```http
Authorization: Bearer <seu_token_jwt>
```
ou `x-access-token`.

---

## 🚀 Endpoints Públicos

### Autenticação
*   `POST /register`: Cria nova conta de usuário.
    *   Body: `{ "name": "...", "email": "...", "password": "..." }`
*   `POST /login`: Autentica usuário e retorna Token.
    *   Body: `{ "email": "...", "password": "..." }`
*   `POST /auth/google`: Login via Google OAuth.
    *   Body: `{ "token": "google_id_token" }`
*   `POST /forgot-password`: Envia email de recuperação (Simulado via Ethereal).

---

## 🛡️ Endpoints Protegidos (Requer Token)

### 📦 Produtos (`/products`)
*   `GET /`: Lista todos os produtos.
*   `POST /`: Cria novo produto (Suporta upload de imagem `multipart/form-data`).
    *   Campos: `name`, `barcode`, `description`, `quantity`, `category`, `image` (arquivo).
*   `PUT /:id`: Atualiza produto.
*   `DELETE /:id`: Remove produto (**Apenas Admin**).

### 🚚 Fornecedores (`/suppliers`)
*   `GET /`: Lista fornecedores.
*   `POST /`: Cria fornecedor.
*   `PUT /:id`: Atualiza fornecedor.
*   `DELETE /:id`: Remove fornecedor (**Apenas Admin**).

### 🛒 Pedidos de Compra (`/orders`)
*   `GET /`: Lista pedidos.
*   `POST /`: Cria pedido de compra.
    *   Body: `{ "supplierId": "...", "items": [...] }`
*   `POST /:id/receive`: Processa recebimento (Entrada no Estoque).
*   `DELETE /:id`: Cancela/Remove pedido (**Apenas Admin**).

### 💰 Vendas (`/sales`)
*   `GET /`: Lista histórico de vendas.
*   `POST /`: Registra nova venda (Saída do Estoque).

### 🤝 Associações (`/associations`)
*   `POST /`: Vincula Produto a Fornecedor.
*   `DELETE /`: Desvincula.

### 👥 Usuários e Admin (`/users`, `/analytics`)
*   `GET /analytics`: Retorna KPIs (Faturamento, Estoque Baixo, etc).
*   `GET /users`: Lista usuários (**Apenas Admin**).
*   `POST /users`: Cria usuário (**Apenas Admin**).

---

## ⚠️ Códigos de Erro Padrão

*   `200/201`: Sucesso.
*   `400`: Erro de validação (Dados inválidos).
*   `401`: Não autorizado (Token inválido ou ausente).
*   `403`: Proibido (Acesso negado, ex: Não é Admin).
*   `404`: Recurso não encontrado.
*   `500`: Erro interno do servidor (Detalhes ocultos por segurança).

## 🛠️ Execução Local

1.  Certifique-se de ter o arquivo `.env` configurado.
2.  Instale pacotes: `npm install`
3.  Rode: `npm run dev`
