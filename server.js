const express = require('express');
const app = express();
const path = require('path');   //used to join path

//To handle POST request in my search page number function, and expose the request to req.body
app.use(express.urlencoded({ extended: true }));

//host listening route set up
const HTTP_PORT = process.env.PORT || 3000;
//import from admin.js
const adminData = require('./modules/admin.js');

//ejs template engine set up, ejs file path set up
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//css
app.use('/public', express.static(path.join(__dirname, 'public')));

//routes
app.use(adminData.routes);
//404 not found
app.use((req, res) => {
    res.status(404).render('404');
});
//error handler, e.g. xkcd api is down
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(502).send('Failed to load comic from xkcd, please try again later.');
});

app.listen(HTTP_PORT, () => {
    console.log(`server listening on: ${HTTP_PORT}`);
});
