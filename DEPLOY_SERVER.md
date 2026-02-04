# Развертывание на сервере

## 🚀 Подготовка сервера (Ubuntu/Debian)

### 1. Обновляем систему
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Устанавливаем Node.js и npm
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Устанавливаем nginx для веб-сервера
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Устанавливаем PM2 для управления процессами
```bash
sudo npm install -g pm2
```

## 📦 Развертывание приложения

### 1. Клонируем репозиторий
```bash
cd /var/www/
sudo git clone https://github.com/ваш-пользователь/ваш-репозиторий.git crm-analytics
cd crm-analytics
sudo chown -R $USER:$USER .
```

### 2. Устанавливаем зависимости
```bash
npm install
```

### 3. Настраиваем переменные окружения
```bash
# Создаем файл переменных
sudo nano .env.local

# Добавляем:
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=ваш_ключ_supabase
```

### 4. Собираем production версию
```bash
npm run build
```

### 5. Настраиваем nginx
```bash
sudo nano /etc/nginx/sites-available/crm-analytics

# Содержимое файла:
server {
    listen 80;
    server_name ваш-домен.com;  # или IP адрес
    
    root /var/www/crm-analytics/dist;
    index index.html;
    
    # Поддержка React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Кеширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Сжатие gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 6. Активируем сайт
```bash
sudo ln -s /etc/nginx/sites-available/crm-analytics /etc/nginx/sites-enabled/
sudo nginx -t  # Проверяем конфигурацию
sudo systemctl reload nginx
```

## 🔒 Настройка SSL (Let's Encrypt)

```bash
# Устанавливаем certbot
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Получаем SSL сертификат
sudo certbot --nginx -d ваш-домен.com

# Автообновление сертификата
sudo crontab -e
# Добавляем строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔄 Автообновление из Git

Создаем скрипт для обновления:
```bash
nano /home/ubuntu/update-app.sh

#!/bin/bash
cd /var/www/crm-analytics
git pull origin main
npm install
npm run build
sudo systemctl reload nginx

# Делаем исполняемым
chmod +x /home/ubuntu/update-app.sh
```

## 🌐 Доступ к приложению

После развертывания приложение будет доступно по адресу:
- HTTP: `http://ваш-домен.com` или `http://IP-адрес`
- HTTPS: `https://ваш-домен.com` (после настройки SSL)

## 📊 Мониторинг

```bash
# Логи nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Статус сервисов
sudo systemctl status nginx
```