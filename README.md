# 📌 Sistema de Agendamentos - Barbearia Premium

## 📖 Descrição do Projeto
O **Barbearia Premium** é um sistema web para gerenciamento de **agendamentos de serviços** em uma barbearia. Ele permite:
- Criar, editar, finalizar, cancelar e excluir agendamentos.
- Listar agendamentos do dia atual.
- Consultar **histórico** de agendamentos com **filtros por data**.
- Visualizar estatísticas (total, finalizados, cancelados e pendentes).
- Ver **agendamentos futuros**.

A aplicação é desenvolvida utilizando **HTML**, **CSS**, **JavaScript** e **Bootstrap**, com comunicação via **API REST** hospedada localmente (JSON Server).

---

## ✅ Funcionalidades
- **Cadastro de Agendamento**
  - Cliente, telefone, serviço, data e horário.
  - Validação para não permitir horários passados.
- **Edição de Agendamento**
  - Permite alterar dados e status.
  - Restrições para agendamentos finalizados ou cancelados.
- **Controle de Status**
  - **Pendente**, **Finalizado**, **Cancelado**.
- **Exclusão**
  - Permitida apenas para agendamentos pendentes.
- **Histórico de Agendamentos**
  - Filtro por **período**.
  - Estatísticas automáticas.
  - Exibição de **agendamentos futuros**.
- **Notificações**
  - Mensagens toast para feedback ao usuário.

---

## 🛠️ Tecnologias Utilizadas
- **HTML5** + **CSS3** (com Bootstrap 5)
- **JavaScript (ES6+)**
- **Bootstrap Icons**
- **Google Fonts (Inter)**
- **JSON Server** (para simulação de API REST)

---

## ⚙️ Configuração e Instalação

### 1️⃣ **Clonar o repositório**
```bash
git clone https://github.com/seu-usuario/controleBarbearia.git
cd controleBarbearia
```

### 2️⃣ **Instalar dependências**
Instale o **JSON Server** (caso não tenha):
```bash
npm install -g json-server
```

### 3️⃣ **Rodar o servidor**
Certifique-se de que o arquivo `db.json` contém as entidades:
```json
{
  "agendamentos": [],
  "servicos": [
    { "id": "1", "nome": "Corte de Cabelo", "preco": 30.00 },
    { "id": "2", "nome": "Barba", "preco": 20.00 }
  ],
  "status": [
    { "id": "1", "nome": "Pendente", "cor": "#ffc107" },
    { "id": "2", "nome": "Finalizado", "cor": "#198754" },
    { "id": "3", "nome": "Cancelado", "cor": "#dc3545" }
  ]
}
```

Inicie o servidor:
```bash
json-server --watch db.json --port 3001
```

### 4️⃣ **Abrir a aplicação**
Abra os arquivos **HTML** no navegador (`index.html` e `historico.html`).

---

## 📌 Como Usar

### **Página Principal (Agendamentos)**
- Lista os **agendamentos do dia atual**.
- Botão **"Novo Agendamento"** para cadastrar.
- Ações disponíveis:
  - ✅ Finalizar
  - ❌ Cancelar
  - ✏️ Editar
  - 🗑️ Excluir (apenas pendentes)

### **Página Histórico**
- Filtros por **Data Início** e **Data Fim**.
- Exibe:
  - Histórico de agendamentos passados.
  - Estatísticas gerais.
  - Agendamentos futuros.
- Botão **Limpar filtros** para restaurar lista completa.

---

## 🔍 Estrutura da API
O projeto consome os seguintes endpoints (via `fetch`):
- `GET /agendamentos` → Lista todos os agendamentos.
- `POST /agendamentos` → Cria novo agendamento.
- `PUT /agendamentos/:id` → Atualiza um agendamento.
- `DELETE /agendamentos/:id` → Exclui um agendamento.
- `GET /servicos` → Lista serviços disponíveis.
- `GET /status` → Lista os status.

---

## ✅ Algumas Regras de Negócio
- Não é possível agendar **data/hora anterior ao momento atual**.
- Não é permitido **alterar status para pendente** se já foi finalizado ou cancelado.
- **Exclusão** apenas para agendamentos **pendentes**.
- Agendamentos finalizados ou cancelados não podem ter **data/hora alteradas**.

