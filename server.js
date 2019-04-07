import express from 'express'
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import bodyParser from 'body-parser';
const app = express();
require( './db' );
app.set('view engine', 'hbs')
const User = mongoose.model("User");
const sessionOptions = {
	secret: 'secret cookie thang (store this elsewhere!)',
	resave: true,
	saveUninitialized: true
};

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
require( './auth' );
app.use(bodyParser.urlencoded({ extended: false }))
app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});

var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({
        username: username
    }, function(err, user) {
        // This is how you handle error
        if (err) return done(err);
        // When user is not found
        if (!user) return done(null, false);
        // When password is not correct
        if (!user.authenticate(password)) return done(null, false);
        // When all things are good, we return the user
        return done(null, user);
     });
}));




app.get("/",(req,res)=>{
  res.render("index");
});
app.get("/register",(req,res)=>{
  res.render("reg");
});
app.get("/login",(req,res)=>{
  res.render("login");
});

app.post('/login', function(req,res,next) {
  passport.authenticate('local', function(err,user) {
    if(user) {
      req.logIn(user, function(err) {
        res.redirect('/');
      });
    } else {
      res.render('/', {message:'Your login or password is incorrect.'});
    }
  })(req, res, next);
});

app.post('/register', function(req, res) {
  User.register(new User({username:req.body.username}),
      req.body.password, function(err, user){
    if (err) {
      res.render('reg',{message:'Your registration information is not valid'});
    } else {
      passport.authenticate('local')(req, res, function() {
        res.redirect('/');
      });
    }
  });
});

app.listen(3000);
