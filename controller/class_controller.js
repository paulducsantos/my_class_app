var express           = require('express');
var Sequelize         = require('sequelize');
var bcrypt            = require('bcryptjs');
var session           = require('express-session');
var bodyParser        = require('body-parser');
var app               = express();

var sequelize = new Sequelize('Class_db', 'root', 'password');

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
  passport.use(new passportLocal(
    function(username, password, done) {
    //check password in db
      Student.findOne({
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
    }));

  app.use(require('express-session')({
    secret: 'crackalackin',
    resave: true,
    saveUninitialized: true,
      cookie : { secure : false, maxAge : (4 * 60 * 60 * 1000) }, // 4 hours
    }));
  app.use(passport.initialize());
  app.use(passport.session());

  module.exports.classController = function(app) {

//routes
app.get('/', function(req, res) {
  res.render('index');
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

  // app.get('/registration', function(req, res) {
  //   res.render('register');
  // });

  app.get('/instructor/dashboard', function(req, res) {
    res.render('success');
  });

  app.get('/student/dashboard', function(req, res) {
    res.render('success');
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

  // app.post('/login', function(req, res) {
  //   var username = req.body.username;
  //   var password = sha256('porkchopsandwiches' + req.body.password);

  //   User.findOne({
  //     where: {
  //       username: username,
  //       password: password
  //     }
  //   }).then(function(user) {
  //     if(user) {
  //       req.session.authenticated = user;
  //       res.redirect('/?msg=login successful');
  //     } else {
  //       res.redirect('/?msg=You failed at life');
  //     }
  //   }).catch(function(err) {
  //     throw err;
  //   });
  // });

  app.post('/login',
    passport.authenticate('local', { successRedirect: '/secret',
                                     failureRedirect: '/?msg=Login Credentials do not work'}));

  app.get('/secret', function(req, res){
    res.render('secret', {
      user: req.user,
      isAuthenticated: req.isAuthenticated()
    });
  });

  // app.get('/success', function(req, res) {
  //   if(req.session.authenticated) {
  //     res.render('success');
  //   } else {
  //     res.render('fail');
  //   }
  // });

  app.get('/logout', function(req, res) {
    req.session.authenticated = false;
    res.redirect('/');
  });
}
