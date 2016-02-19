var express           = require('express');
var expressHandlebars = require('express-handlebars');
var bodyParser        = require('body-parser');
var session           = require('express-session');
var Sequelize         = require('sequelize');
var sha256            = require('sha256');
var app               = express();

const PORT = process.env.PORT || 8080;

var sequelize = new Sequelize('Class_db', 'root', 'password');

app.use(bodyParser.urlencoded({extended: false}));
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var Student = sequelize.define('Student', {
  username: {
    type: Sequelize.STRING,
    validate: {
      len: [1,30]
    }
  },
  password: {
    type: Sequelize.STRING,
  }
});

app.use(session({
  secret: 'have a gr8 day you are pr0',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14
  },
  saveUninitialized: true,
  resave: false
}));

app.get('/', function(req, res) {
  res.render('register');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/register', function(req, res) {
  var username = req.body.username;
  if(req.body.password.length > 7) {
    var password = sha256('porkchopsandwiches' + req.body.password);
    User.create({username: username, password: password}).then(function(user) {
      req.session.authenticated = user;
      res.redirect('/?msg=' + 'youre logged in');
    }).catch(function(err) {
      console.log(err);
      res.redirect('/?msg=' + err.message);
    });
  } else {
    res.render('fail');
  }

  
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = sha256('porkchopsandwiches' + req.body.password);

  User.findOne({
    where: {
      username: username,
      password: password
    }
  }).then(function(user) {
    if(user) {
      req.session.authenticated = user;
      res.redirect('/?msg=login successful');
    } else {
      res.redirect('/?msg=You failed at life');
    }
  }).catch(function(err) {
    throw err;
  });
});

app.get('/success', function(req, res) {
  if(req.session.authenticated) {
    res.render('success');
  } else {
    res.render('fail');
  }
});

app.get('/logout', function(req, res) {
  req.session.authenticated = false;
  res.redirect('/');
})

sequelize.sync().then(function() {
  app.listen(PORT, function() {
    console.log("LISTNEING!");
  });
});