module.exports = {
  apps: [{
    name: 'waxhands-backend',
    script: 'index.js',
    cwd: '/var/www/waxhands-app',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      ROBOKASSA_MERCHANT_LOGIN: 'waxhands.ru',
      ROBOKASSA_PASSWORD_1: 'F4IBBcxNuQA0b70cm9op',
      ROBOKASSA_PASSWORD_2: 'Q2ksZKFaTD65w0b2rFSL',
      ROBOKASSA_PASSWORD_3: '',
      ROBOKASSA_TEST_MODE: 'true',
      ROBOKASSA_SUCCESS_URL: 'https://waxhands.ru/api/robokassa/payment/success',
      ROBOKASSA_FAIL_URL: 'https://waxhands.ru/api/robokassa/payment/fail',
      ROBOKASSA_RESULT_URL: 'https://waxhands.ru/api/robokassa/payment-webhook/robokassa',
      ROBOKASSA_ALGORITHM: 'MD5'
    }
  }]
};
