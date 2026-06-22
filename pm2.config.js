// Конфигурация PM2 — менеджера процессов для Node.js.
// Использование:
//   pm2 start pm2.config.js        — запуск
//   pm2 restart bro                — перезапуск
//   pm2 logs bro                   — логи в реальном времени
//   pm2 save && pm2 startup        — автозапуск после перезагрузки сервера

module.exports = {
  apps: [
    {
      name: 'bro',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/bro',

      // Перезапускаем при падении, но не чаще 10 раз за 10 секунд
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,

      // Порт, на котором слушает Next.js (Nginx проксирует на него)
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Логи пишутся в эти файлы
      out_file: '/var/log/bro/out.log',
      error_file: '/var/log/bro/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
