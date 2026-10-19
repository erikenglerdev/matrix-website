# Die Wahl – rote oder blaue Pille

Eine kleine, mobil optimierte Website im Matrix-Stil:

- **Blaue Pille** – die Erinnerung wird gelöscht, du wachst an einem ganz normalen Morgen auf. Alles bleibt, wie es ist.
- **Rote Pille** – der Code-Regen beschleunigt, das Bild glitcht, und du verlässt die Matrix.

Reines HTML/CSS/JS ohne Abhängigkeiten, ausgeliefert über einen unprivilegierten nginx-Container.

## Struktur

```
.
├── Dockerfile           # nginx-unprivileged (Port 8080, läuft nicht als root)
├── docker-compose.yml   # optional: Start per Compose, gehärtet (read-only, cap_drop)
├── nginx.conf           # Sicherheits-Header, CSP, gzip, /healthz
└── site/
    ├── index.html
    ├── styles.css
    ├── app.js
    └── favicon.svg
```

## Starten mit Docker

```bash
git clone <repo-url> matrix
cd matrix

docker build -t matrix-wahl .
docker run -d --name matrix-wahl -p 8080:8080 --restart unless-stopped matrix-wahl
```

Danach im Browser: <http://localhost:8080>

### Oder mit Docker Compose

```bash
docker compose up -d --build
```

### Aktualisieren

```bash
git pull
docker compose up -d --build
# bzw. ohne Compose:
docker build -t matrix-wahl . && docker rm -f matrix-wahl && \
docker run -d --name matrix-wahl -p 8080:8080 --restart unless-stopped matrix-wahl
```

## Hinweise

- Healthcheck: `GET /healthz` liefert `ok`.
- Hinter einem Reverse Proxy (Traefik, Caddy, nginx) einfach auf Port `8080` des Containers zeigen lassen; TLS übernimmt der Proxy.
- Anderen Host-Port wählen: `-p 3000:8080` bzw. in `docker-compose.yml` anpassen.
- Lokal ohne Docker testen: `cd site && python3 -m http.server 8000`
- Tastatur: `B` = blaue Pille, `R` = rote Pille. `prefers-reduced-motion` wird respektiert.
