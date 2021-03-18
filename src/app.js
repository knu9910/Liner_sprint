const express = require('express');
const app = express();
const auth = require('./controllers/auth');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const apis = require('./controllers/apis');
sequelize.sync();

app.use(
  cors({
    origin: ['https://getliner.com'],
    methods: ['GET', 'POST'],
  })
);
app.use(bodyParser.json());

app.get('/apis/readPagesOrHighlights', apis.readPagesOrHighlights);
app.get('/apis/readPageInHighlights', apis.readPageInHighlights);
app.post('/apis/deleteHighlight', apis.deleteHighlight);
app.post('/apis/updateHighlight', apis.updateHighlight);
app.post('/apis/createHighlight', apis.createHighlight);
app.post('/apis/updateTheme', apis.updateTheme);

app.get('/auth/refresh', auth.refresh);
app.get('/auth/signin', auth.signin);
app.post('/auth/signout', auth.signout);
app.post('/auth/signup', auth.signup);

module.exports = app.listen(3000, () => {
  console.log('listening 3000 port');
});
