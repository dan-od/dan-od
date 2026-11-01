<a href="https://okoro.me"><img src="https://okoro.me/icons/okoro-lockup.png" alt="okoro.me" height="40"></a>

# Daniel Okoro

Networking & IT Security student at Ontario Tech University, and builder of self-hosted things.

I've been taking computers apart since I was a teenager, which turned into a repair business,
an AWS certification and a habit of building tools that solve real problems. Almost everything
I build runs on my own homelab and ships itself through GitHub Actions.

- Right now: SOC analyst (capstone) for the City of Oshawa, triaging FortiSIEM incidents
- Open to: co-op, internship and junior roles in security, networking and infrastructure
- Portfolio: **[okoro.me](https://okoro.me)**, a working retro desktop. Try the Command Prompt.

## Projects

| Project | What it is | Stack | |
|---|---|---|---|
| **[KanbanAI](https://kanban.okoro.me)** | Kanban board that turns meeting notes into tasks, with an MCP server so AI assistants can work the board | React, TypeScript, Express, PostgreSQL, socket.io, MCP | Live |
| **[OSINT Scam Analyzer](https://osint.okoro.me)** | Checks emails, domains, phone numbers and crypto wallets against a dozen threat-intel sources and returns one weighted risk score | Next.js, TypeScript, Tailwind | Live |
| **[okoro.me](https://okoro.me)** · [source](https://github.com/dan-od/portfolio) | My portfolio as a late-90s desktop: window manager, Start menu, Command Prompt, network map, five card games | React 19, Vite, Vitest | Live |
| **[ConfigRefine](https://configrefine.okoro.me)** | _one line from the ConfigRefine project_ | _stack_ | Live |
| **Self-hosted homelab** | The infrastructure everything here runs on | Proxmox, pfSense, Docker, Nginx, Cloudflare Tunnel, Tailscale | Live |
| **SpeedWatch Ontario** | Live road-safety map built after Ontario banned speed cameras; 665k+ Toronto collisions as a heatmap | React, Leaflet, Express, PostgreSQL | Building |
| **[Pro-Tech Networks](https://protechnetworks.org)** | Company site for an ICT firm in Port Harcourt, Nigeria | Astro, GitHub Actions | Client |
| **EMRS** | Equipment and resource management PWA for an oilfield services company | React, Zustand, Express, PostgreSQL | Client |
| **FGC Upper Room** | Website, WhatsApp bot and QR attendance system for a youth fellowship | React, Express, PostgreSQL, BullMQ | Volunteer |

<details>
<summary><b>More on KanbanAI</b></summary>

- AI task extraction from notes or specs, deduplicated against the board, with a provider
  cascade (Gemini, then Anthropic, then OpenAI)
- MCP server with 17 tools: read-only or read-write API keys, confirmation tokens and snapshot rollback
- Real-time sync over socket.io, command palette, board import and export
- Passwordless sign-in where a magic link opened elsewhere has to be approved with a
  number-match from the app, so a forwarded link can't grant a session
- Sliding 30-day sessions with daily token rotation, web push, and transactional email over Resend
  with SPF, DKIM, DMARC and one-click unsubscribe
- Separate staging and production pipelines; staging sits behind Cloudflare Access

</details>

<details>
<summary><b>More on the homelab</b></summary>

- Proxmox VE on refurbished enterprise hardware, segmented with pfSense VLANs
- No open ports: a Cloudflare Tunnel publishes everything through a shared nginx-proxy
- Push-to-deploy: GitHub Actions joins my tailnet as an ephemeral, tagged node, builds,
  then rsyncs or runs `docker compose`, and checks the site answers before finishing
- Each client project runs as its own isolated compose stack; only its nginx touches the public network
- Also runs AdGuard Home, Nextcloud, Immich, Home Assistant and Uptime Kuma

</details>

## Toolbox

- **Security & ops:** FortiSIEM, FortiGate, incident triage, OSINT, pfSense, VLANs, zero-trust access
- **Infrastructure:** Proxmox VE, Docker & Compose, Nginx, Cloudflare Tunnel, Tailscale, Debian, AWS
- **Code:** JavaScript, TypeScript, Python, SQL, Bash · React, Vite, Next.js, Node/Express, PostgreSQL, Redis, Astro
- **Delivery:** GitHub Actions, staging/production pipelines, PWAs

AWS Certified Cloud Practitioner (2024) · B.IT Networking & IT Security, Ontario Tech (2027)

## Get in touch

[okoro.me](https://okoro.me) · [LinkedIn](https://www.linkedin.com/in/daniel-okoro-3905a328b) · daniel.ookoro@gmail.com
