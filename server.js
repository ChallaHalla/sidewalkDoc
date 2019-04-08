import express from 'express'
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import bodyParser from 'body-parser';
const app = express();
require( './db' );
require( './auth' );

app.set('view engine', 'hbs')
const sessionOptions = {
	secret: 'secret cookie thang (store this elsewhere!)',
	resave: true,
	saveUninitialized: true
};

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});

const User = mongoose.model("User");

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
				user.authenticate(password).then((e)=>{
					console.log(e.error);
					if(e.error !== undefined){
						return done(null, false);
					} else{
						return done(null, user);
					}
				});
     });
}));




app.get("/",(req,res)=>{
	console.log(req.user)
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
			console.log(user);
      req.logIn(user, function(err) {
				console.log(user);
        res.redirect('/');
      });
    } else {
			console.log("incorrect credentials");
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
