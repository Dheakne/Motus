const express = require('express');
const { webhook } = require('../controllers/billingController');

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), webhook);

module.exports = router;
