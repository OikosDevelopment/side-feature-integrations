require('dotenv').config();

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const calendarRouter = require('./integrations/calendar');
app.use('/calendar', calendarRouter);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('AI productivity notes backend');
});

app.use('/calendar', calendarRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

