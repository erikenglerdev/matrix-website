# Schlanker, unprivilegierter nginx (läuft nicht als root, lauscht auf 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Dateien als root kopieren und Rechte explizit setzen – unabhängig davon,
# mit welchen Rechten die Dateien im Repo/auf dem Host liegen.
USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
RUN chmod 644 /etc/nginx/conf.d/default.conf \
 && find /usr/share/nginx/html -type d -exec chmod 755 {} + \
 && find /usr/share/nginx/html -type f -exec chmod 644 {} +

# zurück zum unprivilegierten nginx-User
USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
