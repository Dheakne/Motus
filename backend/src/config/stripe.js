const Stripe = require('stripe');
const { stripeSecretKey } = require('./env');

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

module.exports = stripe;
