events {}

http {
    server {
        listen 80;
        server_name api.hps-admin.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name api.hps-admin.com;

        ssl_certificate /etc/ssl/certs/fullchain.pem;
        ssl_certificate_key /etc/ssl/private/privkey.pem;

        location / {
            proxy_pass http://app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Api-Key $http_x_api_key;
            proxy_set_header X-Access-Token $http_x_access_token;
            proxy_set_header X-Refresh-Token $http_x_refresh_token;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
  