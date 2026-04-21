const express = require('express');
const requestRouter = require('./routes/request');
const statsRouter = require('./routes/stats');

const app = express();
app.use(express.json());

app.use('/request', requestRouter);
app.use('/stats', statsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'something went wrong' });
});

module.exports = app;