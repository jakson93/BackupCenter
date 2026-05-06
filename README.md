# Backup Center

Gerenciador web de backups FTP para equipamentos de rede. O sistema roda no mesmo servidor Ubuntu onde o FTP grava os arquivos e **monitora diretamente** a pasta local configurada (ex: `/srv/ftp/backups`).

## Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Banco: SQLite (arquivo em `./data`)
- Deploy: Docker Compose

## Requisitos (Ubuntu)

- Docker Engine + Docker Compose v2

## Configuracao

1. Crie o arquivo `.env` na raiz, com base no `.env.example`.
1. Garanta que a pasta raiz do FTP exista no servidor (exemplo do PRD):

```bash
sudo mkdir -p /srv/ftp/backups
```

3. Ajuste permissoes para que o FTP e o container consigam ler/escrever.

Opcao simples:

```bash
sudo chmod -R 775 /srv/ftp/backups
```

Opcao recomendada com grupo (exemplo):

```bash
sudo groupadd backupftp
sudo usermod -aG backupftp ftpuser
sudo chown -R root:backupftp /srv/ftp/backups
sudo chmod -R 775 /srv/ftp/backups
```

## Subir o sistema

Na raiz do projeto:

```bash
docker compose up -d --build
```

## Acesso

- Painel web: `http://IP_DO_SERVIDOR:8080`
- API: `http://IP_DO_SERVIDOR:3001/api/health`

## Login

O painel exige login.

Defina as credenciais iniciais no `.env` via `MASTER_USER` e `MASTER_PASSWORD`.

## Uso

1. Cadastre equipamentos em **Equipamentos**. O sistema gera (ou usa) a `ftp_folder` e cria automaticamente a pasta dentro de `FTP_BACKUP_ROOT`.
1. O backend executa varredura automatica a cada `SCAN_INTERVAL_SECONDS` e registra novos arquivos na tabela `backups`.
1. Alertas sao gerados automaticamente (backup atrasado, sem backup, arquivo zerado, pasta ausente, permissao, armazenamento).
1. Em **Relatorios** voce pode baixar CSV (backups/alertas/equipamentos) e baixar rapidamente o ultimo backup por equipamento.

## Volumes e dados

- `/srv/ftp/backups:/srv/ftp/backups` (pasta real do FTP)
- `./data:/app/data` (SQLite em `./data/backup-center.sqlite`)

## Desenvolvimento local (opcional)

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend (com proxy para a API em `http://localhost:3001`):

```bash
cd frontend
npm install
npm run dev
```
