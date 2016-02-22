var express           = require('express');
var expressHandlebars = require('express-handlebars');
var bodyParser        = require('body-parser');
var session           = require('express-session');
var Sequelize         = require('sequelize');
var bcrypt            = require('bcryptjs');
var mysql             = require('mysql');
// var routes            = require('./controller/class_controller.js');
var app               = express();

const PORT = process.env.PORT || 8080;

var sequelize = new Sequelize('Class_db', 'root', 'password');

app.use(bodyParser.urlencoded({extended: false}));
app.use('/static', express.static('public'));
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// routes.classController(app);



app.use(session({
  secret: 'have a gr8 day you are pr0',
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 14
  },
  saveUninitialized: true,
  resave: true
}));


  //model
  var Student = sequelize.define('Student', {
    username: {
      type: Sequelize.STRING,
      isUnique: true,
      validate: {
        len: [6,30]
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
  }, {
    hooks: {
      beforeCreate: function(input){
        input.password = bcrypt.hashSync(input.password, 10);
      }
    }
  });

  var Instructor = sequelize.define('Instructor', {
    username: {
      type: Sequelize.STRING,
      isUnique: true,
      validate: {
        len: [6,30]
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
  }, {
    hooks: {
      beforeCreate: function(input){
        input.password = bcrypt.hashSync(input.password, 10);
      }
    }
  });

  Instructor.hasMany(Student);

  var passport = require('passport');
  var passportLocal = require('passport-local').Strategy;
  //middleware init
// app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
  //change the object used to authenticate to a smaller token, and protects the server from attacks
  passport.serializeUser(function(user, done) {
      done(null, user.id);
  });
  passport.deserializeUser(function(id, done) {
      done(null, { id: id, username: id })
  });
  //passport use methed as callback when being authenticated
  passport.use('student', new passportLocal(
    function(username, password, done) {
    //check password in db
      Student.findOne({
        where: {
          username: username
        }
      }).then(function(user) {
          //check password against hash
          if(user){
            bcrypt.compare(password, user.dataValues.password, function(err, user) {
              if (user) {
                    //if password is correct authenticate the user with cookie
                    done(null, { id: username, username: username });
                  } else{
                    done(null, null);
                  }
                });
          } else {
            done(null, null);
          }
        });
      }
    ));

  passport.use('instructor', new passportLocal(
    function(username, password, done) {
    //check password in db
      Instructor.findOne({
        where: {
          username: username
        }
      }).then(function(user) {
        console.log(user);
        console.log(password);
          //check password against hash
          if(user){
            bcrypt.compare(password, user.dataValues.password, function(err, user) {
              console.log(user);
              if (user) {
                    //if password is correct authenticate the user with cookie
                    done(null, { id: username, username: username });
                  } else{
                    done(null, null);
                  }
                });
          } else {
            done(null, null);
          }
        });
      }
    ));


  app.use(passport.initialize());
  app.use(passport.session());



//routes
app.get('/', function(req, res) {
  if(req.isAuthenticated()) {
    res.render('index', {layout: 'loggedIn'});
  } else {
  res.render('index');
  }
});

app.get('/login/:studentOrInstructor', function(req, res) {
  res.render('login');
});

app.get('/registration', function(req, res) {
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
      res.render('register', data)
    });
  });
});



  //MIDDLEWARE FOR LOGGING IN

  var checkAuth = function(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/');
    }
  }

  // function ensureOnlyCompany(req, res, next) {
  //   if (isCompany(req.user)) { return next(); }
  //   res.redirect('/login')
  // }

  app.get('/instructor/dashboard', checkAuth, function(req, res) {
    res.render('instructorDashboard', {
      layout: 'loggedIn',
      user: req.user,
      isAuthenticated: req.isAuthenticated()
    });
  });

  app.get('/student/dashboard', checkAuth, function(req, res) {
    console.log(req.user);
    res.render('studentDashboard', {
      layout: 'loggedIn',
      user: req.user,
      isAuthenticated: req.isAuthenticated()
    });
  });

  app.post('/instructor/register', function(req, res) {
    // var password = sha256('porkchopsandwiches' + req.body.password);
    Instructor.create(req.body).then(function(user) {
      res.redirect('/instructor/dashboard?msg=' + 'youre logged in');
    }).catch(function(err) {
      console.log(err);
      res.redirect('/?msg=' + err.message);
    });
  });

  app.post('/student/register', function(req, res) {
    // req.body.password = sha256('porkchopsandwiches' + req.body.password);
    Student.create(req.body).then(function(user) {
      res.redirect('/student/dashboard?msg=' + 'youre logged in');
    }).catch(function(err) {
      console.log(err);
      res.redirect('/?msg=' + err.message);
    });
  });


  app.post('/login/student',
    passport.authenticate('student', { successRedirect: '/student/dashboard',
                                     failureRedirect: '/?msg=Login Credentials do not work'}));

  app.post('/login/instructor',
  passport.authenticate('instructor', { successRedirect: '/instructor/dashboard',
                                   failureRedirect: '/?msg=Login Credentials do not work'}));

  app.get('/secret', function(req, res){
    res.render('secret', {
      user: req.user,
      isAuthenticated: req.isAuthenticated()
    });
  });


  app.get('/logout', function (req, res){
    req.session.destroy(function (err) {
      res.render('logout');
      setTimeout(function() {
        res.redirect('/');
      }, 5000);
    });
  });

sequelize.sync().then(function() {
  app.listen(PORT, function() {
    console.log("LISTNEING!");
  });
});