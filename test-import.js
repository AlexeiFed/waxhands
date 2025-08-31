import('./dist/routes/payment-webhook.js')
  .then(m => console.log('✅ Import successful:', Object.keys(m)))
  .catch(e => console.error('❌ Import failed:', e.message));
