# App Spotify

Plataforma web para descoberta e reprodução de música a partir do YouTube. Autenticação via Google OAuth, sincronização de playlists e canais inscritos, player embarcado com suporte a áudio e vídeo.

## Screenshots

> Logo abaixo esta as principais telas do projeto e uma descrição breve.

**Tela de login** — Botão "Login com Google" com autenticação OAuth.

![login](assets/screenshots/login.png)

**Página inicial** — Destaques, navegação e cards de playlists/artistas.

![home](assets/screenshots/home.png)

**Detalhes da playlist** — Lista de faixas com gradiente dinâmico no cabeçalho.

![playlist-detail](assets/screenshots/playlist-detail.png)

**Detalhes do artista** — Informações do canal YouTube com gradiente dinâmico.

![artist-detail](assets/screenshots/artist-detail.png)

**Player** — Barra fixa no rodapé com controles de reprodução, progresso e volume.

![player](assets/screenshots/player.png)

**Sidebar de vídeo** — Player do YouTube com detalhes do vídeo e do canal.

![video-sidebar](assets/screenshots/video-sidebar.png)

## Tecnologias

| Tecnologia | Versão |
|---|---|
| [Next.js](https://nextjs.org/) | 16.2.7 |
| [React](https://react.dev/) | 19.2.4 |
| [TypeScript](https://www.typescriptlang.org/) | 5.x |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x |
| [shadcn/ui](https://ui.shadcn.com/) | Radix Nova |
| [Prisma](https://www.prisma.io/) | 6.19.3 |
| [better-auth](https://www.better-auth.com/) | 1.6.14 |
| [SQLite](https://www.sqlite.org/) | — |
| [YouTube Data API v3](https://developers.google.com/youtube/v3) | — |
| [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) | — |
| [FontAwesome](https://fontawesome.com/) | 7.2.0 |
| [Lucide](https://lucide.dev/) | 1.14.0 |

## Arquitetura

Aplicação **Single-Page Application (SPA)** construída sobre o **App Router** do Next.js, utilizando **Server Components** para o layout raiz e **Client Components** para toda a lógica interativa.

### Fluxo de navegação

```
/                  → Página de login (Google OAuth)
/me                → Aplicação principal (SPA)
/api/auth/[...all] → Handler better-auth (Next.js)
/api/auth/refresh-token → Renovação do token Google
```

### Padrão

- **Autenticação**: better-auth com Google OAuth + refresh token automático
- **Estado**: gerenciado localmente no componente `/me` via `useState` e `useRef` (sem estado global)
- **Camadas**: API Routes (backend leve) → Client Components (UI) → YouTube API (dados externos)
- **ORM**: Prisma com SQLite para persistência de sessões e contas

### Fluxo de reprodução

1. Usuário faz login com Google (escopo `youtube.readonly`)
2. A aplicação busca playlists e inscrições do YouTube
3. Ao selecionar uma faixa, um player YouTube IFrame é montado dinamicamente
4. Controles: play/pause, anterior/próximo, progresso, volume, repetir
5. Vídeo pode ser exibido em uma sidebar lateral ou expandido

## Pré-requisitos

- Node.js 20+
- npm / pnpm / yarn
- Conta Google com **YouTube Data API v3** habilitada
- Credenciais OAuth 2.0 (Web application) no [Google Cloud Console](https://console.cloud.google.com/)

## Como executar

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/app-spotify.git
cd app-spotify
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

```env
BETTER_AUTH_SECRET=<seu-secret>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<seu-client-id>
GOOGLE_CLIENT_SECRET=<seu-client-secret>
```

> **BETTER_AUTH_SECRET**: gere com `openssl rand -base64 32`.\
> **Google OAuth**: adicione `http://localhost:3000/api/auth/callback/google` como URI de redirecionamento autorizado.

### 4. Configure o banco de dados

```bash
# Define a URL do SQLite
export DATABASE_URL="file:./dev.db"

# Executa as migrações
npx prisma migrate dev

# (Opcional) Abre o Prisma Studio
npx prisma studio
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura de pastas

```
app-spotify/
├── app/                          # App Router (Next.js)
│   ├── api/auth/                 # Rotas de API (auth, refresh-token)
│   ├── me/page.tsx               # Página principal (SPA)
│   ├── globals.css               # Estilos globais + tema shadcn
│   ├── layout.tsx                # Layout raiz
│   └── page.tsx                  # Página de login
├── components/
│   ├── ui/                       # Componentes base shadcn/ui
│   ├── CardSidebar.tsx           # Item de playlist na sidebar
│   ├── CardArtistSidebar.tsx     # Item de artista na sidebar
│   ├── Header.tsx                # Barra superior com navegação
│   ├── HeaderSearch.tsx          # Barra de pesquisa
│   ├── PlayerMusic.tsx           # Player fixo (controles + progresso)
│   ├── Sidebar.tsx               # Biblioteca (playlists / artistas)
│   ├── SidebarVideo.tsx          # Sidebar de vídeo com detalhes
│   ├── SpotifyCard.tsx           # Card reutilizável (playlist/artista)
│   └── login-google.tsx          # Componente de login OAuth
├── lib/
│   ├── auth.ts                   # Configuração do better-auth
│   ├── auth-client.ts            # Cliente better-auth (navegador)
│   ├── db.ts                     # Singleton PrismaClient
│   ├── get-youtube-token.ts      # Utilitário para refresh de token
│   └── utils.ts                  # Utilitários (cn, classnames)
├── prisma/
│   └── schema.prisma             # Schema SQLite (User, Session, Account)
├── public/                       # Assets estáticos
└── assets/                       # Imagens (no_image.jpg)
```

## Contribuição

1. Fork o repositório e crie uma branch a partir de `main`
2. Mantenha o padrão de commits convencional (`feat:`, `fix:`, `refactor:`)
3. Siga o estilo de código existente (ESLint + TypeScript strict)
4. Certifique-se de que `npm run lint` não acuse erros
5. Abra um Pull Request descrevendo a mudança

## Licença

MIT
