require('dotenv').config();
const app = require('./gateway');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Gateway listening on port ${port}`);
});
