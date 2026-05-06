# PRD + Design System — Backup Center

**Projeto:** Backup Center — Gerenciador Web de Backups FTP  
**Versão:** 1.0  
**Objetivo:** Criar um sistema web visualmente igual ao dashboard aprovado, rodando no próprio servidor Ubuntu onde o FTP está instalado.  
**Público-alvo:** Provedores de internet, NOC, administradores de redes, equipes de infraestrutura e operadores responsáveis por backups de roteadores, switches, OLTs, firewalls e servidores.

---

## 1. Visão geral do projeto

O **Backup Center** será um sistema web completo para monitorar, organizar e auditar backups recebidos por FTP em um servidor Ubuntu.

O sistema deve rodar na mesma máquina onde está o serviço FTP. Como os arquivos já estarão sendo gravados localmente pelo FTP, o sistema deve acessar diretamente a pasta raiz de backups no sistema de arquivos do Ubuntu.

Fluxo principal:

```txt
Equipamento envia backup via FTP
↓
Ubuntu recebe e salva o arquivo em uma pasta local
↓
Backup Center monitora a pasta local
↓
Sistema atualiza dashboard, status, alertas e histórico
```

Exemplo de pasta raiz:

```txt
/srv/ftp/backups
```

Exemplo de estrutura:

```txt
/srv/ftp/backups/
├── olt-huawei-01/
├── core-mikrotik-02/
├── sw-distribuicao-05/
├── firewall-perimetro-01/
├── roteador-edge-03/
└── ap-acme-01/
```

---

## 2. Objetivos principais

O sistema deve permitir:

1. Cadastrar equipamentos que devem enviar backup.
2. Criar automaticamente pastas FTP para cada equipamento.
3. Monitorar a chegada de novos arquivos de backup.
4. Identificar o último backup recebido de cada equipamento.
5. Alertar quando um equipamento parar de enviar backup.
6. Alertar quando a pasta do equipamento não existir.
7. Alertar quando um arquivo vier zerado ou inválido.
8. Exibir uso de armazenamento do servidor.
9. Exibir histórico de backups recebidos.
10. Exibir atividades recentes.
11. Permitir download dos arquivos de backup.
12. Rodar localmente no Ubuntu com Docker Compose.
13. Ter visual premium, escuro, moderno e inspirado em sistemas NOC/SaaS.

---

## 3. Stack técnica recomendada

### 3.1 Frontend

```txt
React + Vite + Tailwind CSS
```

Bibliotecas recomendadas:

```txt
lucide-react        Ícones
recharts            Gráficos
axios               Requisições HTTP
react-router-dom    Rotas do painel
clsx                Classes condicionais
date-fns            Datas e formatação
```

### 3.2 Backend

```txt
Node.js + Express
```

Bibliotecas recomendadas:

```txt
express             API REST
better-sqlite3      Banco SQLite
cors                CORS
helmet              Segurança básica
morgan              Logs HTTP
node-cron           Jobs periódicos
fs-extra            Operações com arquivos/pastas
chokidar            Observação de arquivos em tempo real
archiver            Compressão futura
mime-types          Download de arquivos
```

### 3.3 Banco de dados

```txt
SQLite
```

Motivo:

- Simples de instalar.
- Roda localmente.
- Não depende de serviço externo.
- Ideal para um sistema local no próprio Ubuntu.
- Pode ser migrado futuramente para PostgreSQL.

### 3.4 Deploy

```txt
Docker Compose
```

O sistema deve montar a pasta real do FTP como volume dentro do container.

---

## 4. Arquitetura do sistema

```txt
backup-center/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── database.js
│   │   ├── config.js
│   │   ├── routes/
│   │   │   ├── dashboard.routes.js
│   │   │   ├── equipments.routes.js
│   │   │   ├── backups.routes.js
│   │   │   ├── alerts.routes.js
│   │   │   ├── activities.routes.js
│   │   │   └── server.routes.js
│   │   ├── services/
│   │   │   ├── ftpScanner.service.js
│   │   │   ├── equipment.service.js
│   │   │   ├── backup.service.js
│   │   │   ├── alert.service.js
│   │   │   ├── storage.service.js
│   │   │   ├── folder.service.js
│   │   │   └── activity.service.js
│   │   ├── jobs/
│   │   │   └── backupMonitor.job.js
│   │   └── utils/
│   │       ├── fileUtils.js
│   │       ├── dateUtils.js
│   │       └── formatUtils.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── routes.jsx
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Equipments.jsx
│   │   │   ├── Backups.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── FtpServer.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Settings.jsx
│   │   └── components/
│   │       ├── Sidebar.jsx
│   │       ├── Header.jsx
│   │       ├── MetricCard.jsx
│   │       ├── EquipmentTable.jsx
│   │       ├── AlertPanel.jsx
│   │       ├── FtpFolderTree.jsx
│   │       ├── BackupActivityChart.jsx
│   │       ├── RecentActivities.jsx
│   │       ├── StatusBadge.jsx
│   │       ├── StorageCard.jsx
│   │       ├── SearchBar.jsx
│   │       └── Modal.jsx
│   ├── package.json
│   └── Dockerfile
│
├── data/
│   └── backup-center.sqlite
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. Variáveis de ambiente

Arquivo `.env`:

```env
APP_PORT=8080
API_PORT=3001
FTP_BACKUP_ROOT=/srv/ftp/backups
DATABASE_PATH=/app/data/backup-center.sqlite
SCAN_INTERVAL_SECONDS=60
SERVER_NAME=Ubuntu FTP Server
SERVER_IP=192.168.10.10
DEFAULT_BACKUP_FREQUENCY_HOURS=24
STORAGE_WARNING_PERCENT=80
STORAGE_CRITICAL_PERCENT=90
```

---

## 6. Docker Compose

```yaml
version: "3.8"

services:
  backup-center-backend:
    build:
      context: ./backend
    container_name: backup-center-backend
    restart: always
    ports:
      - "3001:3001"
    volumes:
      - /srv/ftp/backups:/srv/ftp/backups
      - ./data:/app/data
    environment:
      - API_PORT=3001
      - FTP_BACKUP_ROOT=/srv/ftp/backups
      - DATABASE_PATH=/app/data/backup-center.sqlite
      - SCAN_INTERVAL_SECONDS=60
      - SERVER_NAME=Ubuntu FTP Server
      - SERVER_IP=192.168.10.10

  backup-center-frontend:
    build:
      context: ./frontend
    container_name: backup-center-frontend
    restart: always
    ports:
      - "8080:80"
    depends_on:
      - backup-center-backend
```

Acesso ao painel:

```txt
http://IP_DO_SERVIDOR:8080
```

---

## 7. Permissões no Ubuntu

O usuário do FTP e o usuário/container do sistema precisam ter acesso à pasta de backups.

Criar pasta raiz:

```bash
sudo mkdir -p /srv/ftp/backups
```

Opção simples:

```bash
sudo chmod -R 775 /srv/ftp/backups
```

Opção recomendada com grupo:

```bash
sudo groupadd backupftp
sudo usermod -aG backupftp ftpuser
sudo chown -R root:backupftp /srv/ftp/backups
sudo chmod -R 775 /srv/ftp/backups
```

Se o Docker precisar escrever na pasta, garantir que o usuário do container tenha permissão ou rodar o backend com UID/GID compatível.

---

## 8. Banco de dados

### 8.1 Tabela `equipments`

```sql
CREATE TABLE equipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  hostname TEXT,
  ip_address TEXT,
  vendor TEXT,
  model TEXT,
  type TEXT,
  ftp_folder TEXT NOT NULL,
  expected_frequency_hours INTEGER DEFAULT 24,
  enabled INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8.2 Tabela `backups`

```sql
CREATE TABLE backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  checksum TEXT,
  status TEXT DEFAULT 'valid',
  received_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipments(id)
);
```

### 8.3 Tabela `alerts`

```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (equipment_id) REFERENCES equipments(id)
);
```

### 8.4 Tabela `activities`

```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8.5 Tabela `settings`

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. Regras de negócio

### 9.1 Cadastro de equipamento

Ao cadastrar um equipamento, o sistema deve:

1. Validar se o nome foi informado.
2. Validar se a pasta FTP foi informada ou gerar automaticamente com base no nome.
3. Criar a pasta no caminho raiz configurado.
4. Registrar atividade: `Nova pasta criada no FTP`.
5. Registrar o equipamento como ativo.

Exemplo:

```txt
Nome: OLT-Huawei-01
Pasta gerada: /srv/ftp/backups/olt-huawei-01/
```

### 9.2 Geração automática do nome da pasta

Regra:

```txt
OLT Huawei 01 → olt-huawei-01
Core Mikrotik 02 → core-mikrotik-02
SW Distribuição 05 → sw-distribuicao-05
```

Deve remover acentos, converter para minúsculo, trocar espaços por hífen e remover caracteres especiais.

### 9.3 Scanner automático

O backend deve rodar um job a cada `SCAN_INTERVAL_SECONDS`.

O scanner deve:

1. Buscar todos os equipamentos ativos.
2. Verificar se a pasta existe.
3. Listar os arquivos da pasta.
4. Identificar o arquivo mais recente.
5. Registrar arquivos ainda não cadastrados no banco.
6. Calcular tamanho total da pasta.
7. Calcular status do equipamento.
8. Criar ou resolver alertas automaticamente.
9. Registrar atividades relevantes.

### 9.4 Status do equipamento

#### OK

```txt
Existe backup e o último backup está dentro do prazo esperado.
```

#### Atrasado

```txt
Existe backup, mas o último backup passou do limite configurado.
```

#### Falhou

```txt
Último arquivo identificado está com 0 B ou inválido.
```

#### Sem backup recente

```txt
Equipamento cadastrado, mas nenhum arquivo foi encontrado na pasta.
```

#### Pasta não encontrada

```txt
A pasta configurada para o equipamento não existe no Ubuntu.
```

### 9.5 Alertas automáticos

O sistema deve criar alertas para:

```txt
backup_late
backup_missing
zero_byte_file
folder_missing
storage_warning
storage_critical
permission_error
```

Se o problema for normalizado, o sistema deve marcar o alerta como resolvido automaticamente ou permitir resolução manual.

### 9.6 Arquivos considerados backup

Inicialmente, o sistema deve aceitar qualquer arquivo dentro da pasta do equipamento.

Futuramente poderá permitir filtro por extensão:

```txt
.backup
.rsc
.cfg
.conf
.txt
.zip
.tar.gz
```

---

## 10. Endpoints da API

### 10.1 Dashboard

```http
GET /api/dashboard
```

Resposta esperada:

```json
{
  "metrics": {
    "activeBackups": 128,
    "lastBackup": {
      "equipment": "OLT-Huawei-01",
      "receivedAt": "2026-05-06T08:24:15"
    },
    "alertEquipments": 3,
    "storage": {
      "used": 2450000000000,
      "total": 4000000000000,
      "percent": 61
    }
  },
  "equipments": [],
  "alerts": [],
  "folders": [],
  "chart": [],
  "activities": []
}
```

### 10.2 Equipamentos

```http
GET /api/equipments
POST /api/equipments
GET /api/equipments/:id
PUT /api/equipments/:id
DELETE /api/equipments/:id
POST /api/equipments/:id/scan
POST /api/equipments/:id/recreate-folder
```

### 10.3 Backups

```http
GET /api/backups
GET /api/backups/:id
GET /api/backups/:id/download
DELETE /api/backups/:id
```

### 10.4 Alertas

```http
GET /api/alerts
PUT /api/alerts/:id/resolve
PUT /api/alerts/:id/reopen
```

### 10.5 Servidor

```http
GET /api/server/status
POST /api/server/scan
POST /api/server/test-permission
POST /api/server/recreate-folders
GET /api/server/folders
```

### 10.6 Atividades

```http
GET /api/activities
```

---

## 11. Telas do sistema

## 11.1 Layout base

O sistema deve usar um layout fixo com:

1. Sidebar esquerda.
2. Header superior.
3. Conteúdo principal.
4. Painéis laterais no dashboard.
5. Tema escuro premium.

---

## 11.2 Sidebar

Menu lateral com os itens:

```txt
Dashboard
Equipamentos
Backups
Alertas
Servidor FTP
Relatórios
Configurações
```

Na parte inferior da sidebar, exibir card do servidor:

```txt
Servidor Online
Ubuntu 22.04.4 LTS
Uptime: 23 dias, 14:32
IP: 192.168.10.10
Usuário: backup_admin
Ver detalhes do servidor
```

---

## 11.3 Header

O header deve conter:

1. Nome do produto: `Backup Center`.
2. Subtítulo: `Gerenciador de Backups`.
3. Campo de busca.
4. Indicador: `Servidor Ubuntu FTP: Online`.
5. Ícone de notificações com contador.
6. Bloco do servidor com IP.

Texto do campo de busca:

```txt
Buscar equipamentos, backups, pastas...
```

---

## 11.4 Dashboard

A tela principal deve seguir o visual da imagem aprovada.

### Cards superiores

#### Card 1 — Backups ativos

```txt
Título: Backups ativos
Valor: 128
Subtexto: +8 desde ontem
Ícone: banco de dados/backup
Cor: azul
```

#### Card 2 — Último backup realizado

```txt
Título: Último backup realizado
Valor: Hoje, 08:24
Subtexto: OLT-Huawei-01
Ícone: calendário/check
Cor: verde
```

#### Card 3 — Equipamentos com alerta

```txt
Título: Equipamentos com alerta
Valor: 3
Subtexto: Atenção necessária
Ícone: alerta
Cor: laranja
```

#### Card 4 — Armazenamento usado

```txt
Título: Armazenamento usado
Valor: 2,45 TB
Subtexto: de 4,00 TB (61%)
Ícone: gráfico circular
Cor: roxo
```

---

## 11.5 Tabela de status dos equipamentos

Título:

```txt
Status dos Equipamentos e Backups
```

Colunas:

```txt
Equipamento
IP
Último backup
Status
Pasta FTP
Tamanho
Ações
```

Exemplo de linhas:

```txt
OLT-Huawei-01        10.0.0.1    Hoje, 08:24:15          OK                 /backups/olt-huawei-01/        12,45 GB
Core-Mikrotik-02     10.0.0.2    Ontem, 22:15:07         OK                 /backups/core-mikrotik-02/     8,32 GB
SW-Distribuição-05   10.0.0.5    2 dias atrás, 18:45:10  Atrasado           /backups/sw-distribuicao-05/   4,18 GB
Roteador-Edge-03     10.0.0.3    Hoje, 07:10:33          OK                 /backups/roteador-edge-03/     3,67 GB
Firewall-Perimetro   10.0.0.4    3 dias atrás, 09:12:01  Atrasado           /backups/firewall-perimetro/   6,21 GB
AP-ACME-01           10.0.0.6    7 dias atrás, 14:22:18  Falhou             /backups/ap-acme-01/           0 B
Core-R1              10.0.0.7    Nunca                   Sem backup recente /backups/core-r1/              0 B
```

Ações por linha:

```txt
Abrir pasta
Ver histórico
Forçar varredura
Editar equipamento
Excluir equipamento
```

---

## 11.6 Painel de alertas

Título:

```txt
Alertas
```

Exemplos:

```txt
OLT-Huawei-01
Backup atrasado
Último backup há mais de 24 horas.

Core-Mikrotik-02
Backup atrasado
Último backup há mais de 24 horas.

SW-Distribuição-05
Backup atrasado
Último backup há mais de 48 horas.
```

Cada alerta deve ter:

```txt
Ícone de alerta
Nome do equipamento
Tipo do alerta
Mensagem curta
Tempo relativo
Indicador de severidade
```

---

## 11.7 Painel de pastas FTP

Título:

```txt
Pastas no Servidor FTP
```

Mostrar árvore:

```txt
/backups
├── core-r1/
├── core-mikrotik-02/       8,32 GB
├── firewall-perimetro-01/  6,21 GB
├── olt-huawei-01/          12,45 GB
├── roteador-edge-03/       3,67 GB
├── sw-distribuicao-05/     4,18 GB
└── ap-acme-01/             0 B
```

No rodapé do card:

```txt
Total usado: 2,45 TB de 4,00 TB
61%
```

---

## 11.8 Gráfico de atividade de backups

Título:

```txt
Atividade de Backups
```

Subtítulo:

```txt
Últimos 7 dias
```

Dados:

```txt
Sucesso
Falha
```

O gráfico deve ser de barras, com verde para sucesso e vermelho para falha.

---

## 11.9 Atividades recentes

Título:

```txt
Atividades Recentes
```

Exemplos:

```txt
Backup concluído com sucesso
OLT-Huawei-01
Hoje, 08:24:15

Nova pasta criada no FTP
/backups/ap-acme-01/
Hoje, 08:20:31

Falha na coleta de backup
AP-ACME-01
Ontem, 14:22:18

Alerta enviado
Core-R1 - Sem backup recente
Ontem, 09:15:42
```

---

## 11.10 Tela Equipamentos

A tela deve permitir:

1. Listar equipamentos.
2. Cadastrar equipamento.
3. Editar equipamento.
4. Desativar equipamento.
5. Excluir cadastro.
6. Criar/recriar pasta FTP.
7. Forçar varredura individual.
8. Ver histórico do equipamento.

Campos do formulário:

```txt
Nome do equipamento
Hostname
IP
Tipo
Fabricante
Modelo
Frequência esperada de backup em horas
Pasta FTP
Observações
Ativo/Inativo
```

Tipos:

```txt
Router
Switch
OLT
Firewall
AP
Servidor
Outro
```

Fabricantes:

```txt
Huawei
MikroTik
ZTE
Cisco
Intelbras
Juniper
Outro
```

---

## 11.11 Tela Backups

Deve listar todos os arquivos encontrados.

Colunas:

```txt
Equipamento
Arquivo
Data de recebimento
Tamanho
Caminho
Status
Ações
```

Ações:

```txt
Baixar
Ver detalhes
Excluir arquivo
Abrir pasta
```

Filtros:

```txt
Equipamento
Status
Data inicial
Data final
Tamanho
```

---

## 11.12 Tela Alertas

Colunas:

```txt
Equipamento
Tipo
Severidade
Mensagem
Criado em
Status
Ações
```

Ações:

```txt
Resolver alerta
Reabrir alerta
Ver equipamento
Forçar nova varredura
```

---

## 11.13 Tela Servidor FTP

Exibir:

```txt
Nome do servidor
IP
Sistema operacional
Status do FTP
Pasta raiz dos backups
Espaço total
Espaço usado
Espaço livre
Percentual usado
Quantidade de equipamentos
Quantidade de pastas
Quantidade de arquivos de backup
Última varredura
```

Botões:

```txt
Testar permissão de leitura/escrita
Forçar varredura manual
Recriar pastas ausentes
Atualizar status
```

---

## 12. Design System

## 12.1 Identidade visual

O visual deve ser igual ao mockup aprovado: dashboard escuro, sofisticado, com sensação de sistema NOC moderno.

Palavras-chave do estilo:

```txt
Premium
Escuro
Técnico
NOC
Infraestrutura
SaaS
Moderno
Organizado
Confiável
Alta legibilidade
```

---

## 12.2 Paleta de cores

### Cores principais

```txt
Background principal:      #07111F
Background secundário:    #0B1628
Card principal:           #0F1B2D
Card elevado:             #132238
Card hover:               #182B45
Borda sutil:              #1F334D
Borda ativa:              #2F5F9F
Texto principal:          #F8FAFC
Texto secundário:         #CBD5E1
Texto terciário:          #94A3B8
Texto fraco:              #64748B
```

### Cores de status

```txt
OK / Sucesso:             #22C55E
OK background:            rgba(34, 197, 94, 0.12)
OK border:                rgba(34, 197, 94, 0.35)

Atrasado / Atenção:       #F59E0B
Atrasado background:      rgba(245, 158, 11, 0.12)
Atrasado border:          rgba(245, 158, 11, 0.35)

Falha / Crítico:          #EF4444
Falha background:         rgba(239, 68, 68, 0.12)
Falha border:             rgba(239, 68, 68, 0.35)

Informativo / Azul:       #3B82F6
Info background:          rgba(59, 130, 246, 0.12)
Info border:              rgba(59, 130, 246, 0.35)

Armazenamento / Roxo:     #A855F7
Roxo background:          rgba(168, 85, 247, 0.12)
Roxo border:              rgba(168, 85, 247, 0.35)
```

---

## 12.3 Gradientes

### Card azul

```css
background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(15,27,45,0.95));
border: 1px solid rgba(59,130,246,0.35);
```

### Card verde

```css
background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(15,27,45,0.95));
border: 1px solid rgba(34,197,94,0.35);
```

### Card laranja

```css
background: linear-gradient(135deg, rgba(245,158,11,0.20), rgba(15,27,45,0.95));
border: 1px solid rgba(245,158,11,0.35);
```

### Card roxo

```css
background: linear-gradient(135deg, rgba(168,85,247,0.18), rgba(15,27,45,0.95));
border: 1px solid rgba(168,85,247,0.35);
```

---

## 12.4 Tipografia

Fonte recomendada:

```txt
Inter
```

Fallback:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Escala:

```txt
Título principal:      24px / 700
Título de página:      22px / 700
Título de card:        14px / 600
Valor grande:          32px / 800
Valor médio:           24px / 700
Texto normal:          14px / 400
Texto secundário:      13px / 400
Texto pequeno:         12px / 500
Badge:                 11px / 700
```

---

## 12.5 Espaçamento

```txt
4px   micro espaço
8px   espaço pequeno
12px  espaço entre textos
16px  padding padrão de card
20px  padding médio
24px  gap entre seções
32px  espaçamento grande
```

---

## 12.6 Bordas e radius

```txt
Cards principais:      16px
Botões:                10px
Inputs:                12px
Badges:                8px
Ícones circulares:     999px
Tabela:                12px
```

---

## 12.7 Sombras

```css
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
```

Cards internos:

```css
box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.18);
```

---

## 12.8 Componentes

### AppShell

Estrutura principal com sidebar, header e área de conteúdo.

### Sidebar

Estados:

```txt
Normal
Hover
Ativo
Com badge de alerta
```

Item ativo:

```css
background: linear-gradient(135deg, rgba(59,130,246,0.35), rgba(37,99,235,0.20));
border: 1px solid rgba(59,130,246,0.35);
```

### Header

Deve ter:

```txt
Busca global
Status do servidor
Notificações
Identificação do servidor
```

### MetricCard

Props:

```txt
title
value
subtitle
icon
variant: blue | green | orange | purple
```

### StatusBadge

Variantes:

```txt
OK
Atrasado
Falhou
Sem backup recente
Pasta não encontrada
```

Estilos:

```txt
OK: verde
Atrasado: laranja
Falhou: vermelho
Sem backup recente: cinza
Pasta não encontrada: vermelho/laranja
```

### EquipmentTable

Tabela com linhas compactas, bordas sutis e ações à direita.

### AlertPanel

Lista de alertas com ícone, linha lateral colorida, tempo e severidade.

### FtpFolderTree

Árvore visual de pastas com ícone amarelo de diretório e tamanho à direita.

### BackupActivityChart

Gráfico de barras com sucesso/falha nos últimos 7 dias.

### RecentActivities

Feed com ícones coloridos:

```txt
check verde
folder azul
x vermelho
bell amarelo
```

---

## 13. Responsividade

### Desktop

Layout principal igual ao mockup:

```txt
Sidebar fixa à esquerda
Header no topo
Cards em 4 colunas
Tabela central
Painéis laterais à direita
Gráficos na parte inferior
```

### Tablet

```txt
Sidebar pode ficar recolhível
Cards em 2 colunas
Painéis laterais abaixo da tabela
```

### Mobile

```txt
Sidebar vira menu drawer
Cards em 1 coluna
Tabela vira cards por equipamento
Painéis empilhados verticalmente
```

---

## 14. Requisitos de UX

1. O dashboard deve carregar rapidamente.
2. O usuário deve entender imediatamente quais equipamentos estão com problema.
3. Alertas devem ser visíveis sem precisar abrir outra tela.
4. Status devem ser coloridos e objetivos.
5. O sistema deve evitar excesso de informação desnecessária.
6. Cada equipamento deve ter ações rápidas.
7. O visual deve passar confiança e profissionalismo.
8. A busca global deve localizar equipamentos, IPs, pastas e arquivos.
9. O sistema deve mostrar datas relativas, como `Hoje`, `Ontem`, `2 dias atrás`.
10. A interface deve ser confortável para uso em monitor de NOC.

---

## 15. Segurança

Primeira versão pode rodar em rede interna, mas já deve estar preparada para login.

### MVP

```txt
Sem login obrigatório, acesso por rede interna.
```

### Versão recomendada

Adicionar autenticação local:

```txt
Usuário admin
Senha criptografada
Sessão JWT ou cookie seguro
```

Não expor o sistema diretamente para internet sem autenticação.

---

## 16. Logs e auditoria

Registrar atividades como:

```txt
Equipamento cadastrado
Equipamento editado
Pasta criada
Backup detectado
Backup baixado
Alerta criado
Alerta resolvido
Varredura manual executada
Erro de permissão detectado
```

---

## 17. Critérios de aceite

O projeto só deve ser considerado pronto quando:

1. Rodar no Ubuntu via Docker Compose.
2. Acessar a pasta real `/srv/ftp/backups` via volume.
3. Permitir cadastrar equipamento.
4. Criar pasta automaticamente ao cadastrar equipamento.
5. Detectar arquivos de backup existentes.
6. Registrar backups no SQLite.
7. Mostrar último backup por equipamento.
8. Calcular status OK/Atrasado/Falhou/Sem backup.
9. Gerar alertas automaticamente.
10. Mostrar dashboard visualmente próximo ao mockup aprovado.
11. Mostrar árvore de pastas FTP.
12. Mostrar uso de armazenamento.
13. Permitir download do backup.
14. Permitir varredura manual.
15. Ter README com instalação no Ubuntu.

---

## 18. Prompt completo para IA desenvolvedora

Use este prompt no Cursor, Claude, Lovable, Bolt ou outra IA de desenvolvimento:

```txt
Crie um projeto completo chamado Backup Center.

O sistema deve ser um gerenciador web de backups FTP para equipamentos de rede. Ele vai rodar no próprio servidor Ubuntu onde já existe um serviço FTP ativo. O FTP salva arquivos localmente em /srv/ftp/backups, e o sistema deve monitorar essa pasta diretamente pelo sistema de arquivos, sem precisar conectar como cliente FTP.

Stack obrigatória:
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Banco: SQLite
- Deploy: Docker Compose
- O backend deve montar e acessar a pasta real /srv/ftp/backups por volume Docker

Objetivo visual:
Criar uma interface igual ao mockup aprovado do Backup Center: tema escuro premium, dashboard estilo NOC/SaaS, sidebar à esquerda, header superior, cards de métricas, tabela central de equipamentos, painel de alertas à direita, árvore de pastas FTP, gráfico de backups dos últimos 7 dias e feed de atividades recentes.

Cores principais:
- Background: #07111F
- Cards: #0F1B2D
- Bordas: #1F334D
- Azul: #3B82F6
- Verde: #22C55E
- Laranja: #F59E0B
- Vermelho: #EF4444
- Roxo: #A855F7
- Texto principal: #F8FAFC
- Texto secundário: #CBD5E1

Funcionalidades obrigatórias:

1. Dashboard
- Cards superiores:
  - Backups ativos
  - Último backup realizado
  - Equipamentos com alerta
  - Armazenamento usado
- Tabela de status dos equipamentos:
  - Equipamento
  - IP
  - Último backup
  - Status
  - Pasta FTP
  - Tamanho
  - Ações
- Painel de alertas
- Painel de pastas no servidor FTP
- Gráfico dos últimos 7 dias com sucesso e falha
- Atividades recentes

2. Equipamentos
- Cadastrar equipamento
- Editar equipamento
- Desativar equipamento
- Excluir equipamento
- Criar pasta automaticamente
- Recriar pasta ausente
- Forçar varredura individual

Campos:
- Nome
- Hostname
- IP
- Tipo
- Fabricante
- Modelo
- Pasta FTP
- Frequência esperada de backup em horas
- Observações
- Ativo/Inativo

3. Monitoramento automático
Criar um job que rode a cada 60 segundos para:
- Ler equipamentos ativos
- Verificar pasta de cada equipamento
- Listar arquivos
- Identificar arquivo mais recente
- Registrar novos backups no banco SQLite
- Calcular tamanho da pasta
- Atualizar status
- Criar alertas
- Resolver alertas quando normalizar

Status:
- OK: último backup dentro do prazo
- Atrasado: último backup passou do limite configurado
- Falhou: arquivo mais recente tem 0 B ou é inválido
- Sem backup recente: pasta existe, mas não há arquivos
- Pasta não encontrada: pasta configurada não existe

4. Backups
- Listar arquivos encontrados
- Filtrar por equipamento, data e status
- Permitir download
- Permitir excluir arquivo

5. Alertas
- Listar alertas
- Permitir resolver alerta
- Permitir reabrir alerta
- Criar alerta automático para backup atrasado, sem backup, arquivo zerado, pasta ausente, erro de permissão e armazenamento crítico

6. Servidor FTP
- Mostrar status do servidor
- Mostrar pasta raiz
- Mostrar espaço usado, total e livre
- Mostrar quantidade de equipamentos, pastas e backups
- Botão para testar permissão de leitura/escrita
- Botão para forçar varredura
- Botão para recriar pastas ausentes

7. Banco de dados SQLite
Criar tabelas:
- equipments
- backups
- alerts
- activities
- settings

8. API REST
Criar endpoints:
GET /api/dashboard
GET /api/equipments
POST /api/equipments
GET /api/equipments/:id
PUT /api/equipments/:id
DELETE /api/equipments/:id
POST /api/equipments/:id/scan
POST /api/equipments/:id/recreate-folder
GET /api/backups
GET /api/backups/:id/download
DELETE /api/backups/:id
GET /api/alerts
PUT /api/alerts/:id/resolve
PUT /api/alerts/:id/reopen
GET /api/server/status
POST /api/server/scan
POST /api/server/test-permission
POST /api/server/recreate-folders
GET /api/activities

9. Docker
Criar Dockerfile para backend, Dockerfile para frontend e docker-compose.yml.
O docker-compose deve montar:
/srv/ftp/backups:/srv/ftp/backups
./data:/app/data

10. README
Criar README completo com:
- Como instalar no Ubuntu
- Como configurar .env
- Como subir com Docker Compose
- Como acessar o painel
- Como ajustar permissões da pasta /srv/ftp/backups

Entregue o projeto completo, funcional, organizado e com visual profissional próximo ao mockup aprovado.
```

---

## 19. Roadmap futuro

Após o MVP, adicionar:

```txt
Login e usuários
Notificações por Telegram
Notificações por WhatsApp
Integração com Zabbix
Integração com MikroTik API
Integração com Huawei via SSH
Coleta automática de backup via SSH/Telnet
Comparação entre versões de backup
Diff visual entre configurações
Retenção automática de backups antigos
Relatórios PDF
Multi-servidor FTP
```

---

## 20. Observação final de desenvolvimento

A regra mais importante deste projeto é:

```txt
O Backup Center deve rodar no próprio Ubuntu onde está o FTP e ler diretamente a pasta local dos backups.
```

Ou seja, o sistema não deve depender de conexão FTP para monitorar os arquivos. Ele deve apenas observar o diretório onde o FTP já grava os backups.

Isso torna o sistema mais rápido, mais seguro e mais confiável.
