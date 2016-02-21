var express           = require('express');
var expressHandlebars = require('express-handlebars');
var bodyParser        = require('body-parser');
var session           = require('express-session');
var Sequelize         = require('sequelize');
var sha256            = require('sha256');
var mysql             = require('mysql');
var app               = express();

const PORT = process.env.PORT || 8080;

var sequelize = new Sequelize('Class_db', 'root', 'password');

app.use(bodyParser.urlencoded({extended: false}));
app.use('/static', express.static('public'));
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var Student = sequelize.define('Student', {
  username: {
    type: Sequelize.STRING,
    validate: {
      len: [6,30],
      isUnique: true
    }
  },
  password: {
    type: Sequelize.STRING,
    notEmpty: true
  },
  firstname: {
    type: Sequelize.STRING,
    notEmpty: true
  },
  lastname: {
    type: Sequelize.STRING,
    notEmpty: true
  },
  teacherID: {
    type: Sequelize.INTEGER,
    notEmpty: true
  },
  taID: {
    type: Sequelize.INTEGER,
  },
  taID2: {
    type: Sequelize.INTEGER,
  }
});

var Instructor = sequelize.define('Instructor', {
  username: {
    type: Sequelize.STRING,
    validate: {
      len: [6,30],
      isUnique: true
    }
  },
  password: {
    type: Sequelize.STRING,
    notEmpty: true
  },
  teachOrTA: {
    type: Sequelize.STRING,
    notEmpty: true
  },
  firstname: {
    type: Sequelize.STRING,
    notEmpty: true
  },
    lastname: {
    type: Sequelize.STRING,
    notEmpty: true
  }
});

Instructor.hasMany(Student);

app.use(session({
  secret: 'have a gr8 day you are pr0',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14
  },
  saveUninitialized: true,
  resave: false
}));

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/login/:studentOrInstructor', function(req, res) {
  res.render('login');
});

app.get('/student/register', function(req, res) {
  var data;
  Instructor.findAll({
    where: {
      teachOrTA: 'teacher'
    }
  }).then(function(teacher) {
    data = {
      teacher: teacher
    }
    Instructor.findAll({
      where: {
        teachOrTA: 'ta'
      }
    }).then(function(ta) {
      data.ta = ta;
      res.render('student_register', data)
    });
  });
});

app.get('/instructor/register', function(req, res) {
  res.render('instructor_register');
});

app.get('/instructor/dashboard', function(req, res) {
  res.render('success');
});

app.get('/student/dashboard', function(req, res) {
  res.render('success');
});

app.post('/instructor/register', function(req, res) {
  var username = req.body.username;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var teachOrTA = req.body.teachOrTA;
  if(req.body.password.length > 7) {
    var password = sha256('porkchopsandwiches' + req.body.password);
    Instructor.create({username: username, password: password, firstname: firstname, lastname: lastname, teachOrTA: teachOrTA}).then(function(user) {
      req.session.authenticated = user;
      res.redirect('/instructor/dashboard?msg=' + 'youre logged in');
    }).catch(function(err) {
      console.log(err);
      res.redirect('/?msg=' + err.message);
    });
  } else {
    res.render('fail');
  } 
});

app.post('/student/register', function(req, res) {
  if(req.body.password.length > 7) {
    req.body.password = sha256('porkchopsandwiches' + req.body.password);
    Student.create(req.body).then(function(user) {
      req.session.authenticated = user;
      res.redirect('/student/dashboard?msg=' + 'youre logged in');
    }).catch(function(err) {
      console.log(err);
      res.redirect('/?msg=' + err.message);
    });
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