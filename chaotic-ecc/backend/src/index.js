require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { startListener } = require('./listener');

const app = express();
app.use(bodyParser.json());
app.use('/api', routes);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Gateway listening on port ${port}`);
  try {
    await startListener();
  } catch (err) {
    console.error('Listener failed to start:', err.message);
  }
});
