FROM node:22.23.4-alpine

RUN apk add --no-cache nginx && mkdir -p /run/nginx /var/lib/nginx && chown -R nginx:nginx /var/lib/nginx
COPY nginx.conf /etc/nginx/nginx.conf
RUN nginx -t

EXPOSE 8080
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
ENV PATH="/app/node_modules/.bin:${PATH}"
COPY . .
CMD ["sh", "scripts/start.sh"]
