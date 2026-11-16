# Celina Sousa Turismo — Caldas Locações

Plataforma web completa, responsiva e administrável desenvolvida para **Celina Sousa Turismo (`Caldas Locações`)**, integrando:
1. **Site Público** (`/`, `/clubes`, `/clubes/:slug`, `/viagens`, `/viagens/:slug`, `/sobre`, `/perguntas-frequentes`, `/contato`)
2. **Área Exclusiva de Clientes** (`/entrar`, `/minha-conta`)
3. **Painel Administrativo Exclusivo da Celina** (`/painel-celina`)

---

## Identidade Comercial Oficial Configurada

- **Empresa:** Celina Sousa Turismo — Caldas Locações
- **WhatsApp e Telefone:** `(64) 9 9206-5866` (`https://wa.me/5564992065866`)
- **Instagram:** [`@celinasousaturismo`](https://www.instagram.com/celinasousaturismo/)
- **Logotipo Oficial:** `/assets/images/logo-original.jpeg` (editável pelo Painel Administrativo)

> **Importante:** Nenhum preço, endereço, política comercial ou disponibilidade fictícia foi fixado no código. Todas as informações comerciais, clubes, viagens, fotos, perguntas frequentes, depoimentos e textos institucionais são armazenados no banco de dados relacional e gerenciados diretamente pela Celina no Painel Administrativo.

---

## Arquitetura e Tecnologias

- **Frontend:** React 18, React Router v6, Tailwind CSS, Lucide Icons, Vite 6.
- **Backend:** Node.js, Express, autenticação JWT (`httpOnly` cookie + Bearer token), `bcryptjs` (hash seguro de senhas), `multer` (upload de múltiplas imagens com validação de extensão, MIME type e assinatura binária / magic bytes), `helmet` e `express-rate-limit`.
- **Banco de Dados:** SQLite relacional (`node:sqlite` em modo WAL com `FOREIGN KEYS` ativas), contendo tabelas para:
  - `users` (clientes e administradora, com controle de permissões `role` e flag `must_change_password`)
  - `destinations` (destinos cadastrados)
  - `clubs` e `club_images` (catálogo de clubes, hotéis e parques com galeria categorizada e ordenada)
  - `trips` e `trip_images` (viagens, pacotes e excursões com status, vagas, transporte e hospedagem)
  - `availability` (calendário de disponibilidades e capacidades por data)
  - `bookings` (solicitações de agendamento e reservas com código identificador único `CST-YYMMDD-XXXX`)
  - `messages` (mensagens enviadas pelo formulário de contato)
  - `notifications` (notificações em tempo real para a Celina e para cada cliente)
  - `testimonials` (depoimentos de clientes)
  - `faqs` (perguntas frequentes)
  - `gallery_items` (galeria institucional da página inicial)
  - `site_settings` (configurações dinâmicas do site e páginas institucionais)
  - `audit_logs` (histórico de alterações administrativas)
  - `password_reset_requests` (registro de recuperação segura de senha)

---

## Como Instalar e Executar Localmente

### 1. Pré-requisitos
- **Node.js** v22+ e **npm**

### 2. Instalação das dependências
```bash
npm install
```

### 3. Configuração das variáveis de ambiente (`.env`)
Copie o arquivo `.env.example` para `.env` e ajuste as variáveis conforme o ambiente:
```bash
cp .env.example .env
```
Variáveis disponíveis no `.env`:
- `PORT=3001` — Porta do servidor backend Express
- `JWT_SECRET` — Chave secreta longa e aleatória para assinatura de sessões JWT
- `ADMIN_INIT_USERNAME` — Usuário inicial de desenvolvimento para criação da primeira conta administrativa
- `ADMIN_INIT_PASSWORD` — Senha temporária inicial (exige troca obrigatória no primeiro acesso)
- `DATABASE_PATH=./data/celina_turismo.db` — Caminho do arquivo de banco de dados SQLite
- `UPLOADS_DIR=./public/uploads` — Diretório persistente para armazenamento das fotos enviadas pela Celina

### 4. Executar em ambiente de desenvolvimento (2 Sites Separados e Conectados)
```bash
npm run dev
```
Esse comando sobe simultaneamente os dois sites independentes conectados ao mesmo servidor e banco de dados:
- **Site de Clientes (`http://0.0.0.0:5173`):** Site público e área exclusiva dos clientes (sem exibir login administrativo para visitantes).
- **Portal ADM da Celina (`http://0.0.0.0:5174`):** Site exclusivo para o login e gerenciamento administrativo da Celina Sousa Turismo.
- **Servidor API & Banco de Dados (`http://0.0.0.0:3001`):** Backend compartilhado que sincroniza tudo em tempo real entre os dois sites.

### 5. Build e Execução para Produção (Publicação)
Você pode publicar os dois ambientes em domínios/subdomínios separados (ex.: `celinasousaturismo.com.br` e `admin.celinasousaturismo.com.br`) ou unificados:
```bash
# Gerar build separado do Site de Clientes (dist/customer)
npm run build:customer

# Gerar build separado do Portal ADM da Celina (dist/admin)
npm run build:admin

# Ou build padrão unificado + iniciar servidor
npm run build
npm start
```
Em produção (`NODE_ENV=production`), o servidor Express serve tanto a API (`/api/*`), os arquivos de mídia (`/uploads/*`, `/assets/*`) quanto o aplicativo React otimizado (`dist/`).

---

## Acesso Administrativo Inicial

1. No topo do site, clique em **"Entrar"** -> **"Acesso administrativo"** (ou acesse `/entrar?modo=admin`).
2. Na primeira inicialização em ambiente de desenvolvimento, utilize as credenciais configuradas no `.env`:
   - **Usuário:** `celina.admin`
   - **Senha temporária:** configurada em `ADMIN_INIT_PASSWORD`
3. Assim que entrar pela primeira vez, o sistema exibirá automaticamente a tela de **Segurança do Primeiro Acesso**, exigindo a substituição da senha temporária por uma senha pessoal definitiva da Celina.
