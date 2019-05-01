import express from 'express'
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import bodyParser from 'body-parser';
const app = express();
const ObjectId = require('mongoose').Types.ObjectId;
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
	req.session.typedUser = req.typedUser;
	next();
});

const User = mongoose.model("User");
const Alert = mongoose.model("Alert");
const Patient = mongoose.model("Patient");
const Doctor = mongoose.model("Doctor");

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
	console.log(req.session)
  res.render("index");
});

app.post('/createAlert', function(req, res) {
	const description = req.body.description;
	const severity = req.body.severity;

	let tags = req.body.tags;
	tags = tags.substring(1,tags.length-1).split(",");

	const alert = new Alert({
		description: description,
		severity:severity,
		tags: tags,
	});
	alert.save((e)=>{
		res.json({
			"status": "success",
	});
});
});

app.post('/updateAlert', function(req, res) {
});

app.get("/register",(req,res)=>{
  res.render("reg");
});
app.get("/login",(req,res)=>{
  res.render("login");
});

app.post('/login', function(req,res,next) {
	// need to address weird req structure
	req.body = JSON.parse(Object.keys(req.body)[0]);
  passport.authenticate('local', function(err,user) {
    if(user) {
      req.logIn(user, function(err) {
				// find typedUser associated with user acct
				function findTypedUser(err, typedUser){
					if(err){
						console.log("error in finding typed user", err);
					}
					req.session.typedUser = typedUser;
					res.redirect('/');
				}
				if(req.body.doctor === "on"){
					Doctor.findOne({user:user._id}, findTypedUser);
				}
				else if(req.body.patient === "on"){
					Patient.findOne({user:user._id}, findTypedUser);
				}

      });
    } else {
			res.json({
				status:"incorrect credentials"
			});
    }
  })(req, res, next);
});

app.post('/register', function(req, res) {
	req.body = JSON.parse(Object.keys(req.body)[0]);
	console.log(req.body);
	const userType = req.body.userType;
	const name = req.body.name;
	const location = {
		latitude: req.body.latitude,
		longitude: req.body.longitude,
	};
  User.register(new User({username:req.body.username}),
      req.body.password, function(err, user){
    if (err) {
			res.json({
				status:"error"
			});
    } else {
      passport.authenticate('local')(req, res, function() {
				// create doctor or patient object and place user within here
				let typedUser;
				if(userType === "patient"){
					typedUser = new Patient({
						name:name,
						user: user._id,
					});
				}else{
					typedUser = new Doctor({
						name:name,
						user: user._id,
						latitude: location.latitude,
						longitude: location.longitude,
					});
				}
				console.log(typedUser);
				typedUser.save((e)=>{
					res.json({
						status:"account created"
					});
				});
      });
    }
  });
});

// NOTE: send lat and long as decimal degress, NOT degrees, minutes, seconds
app.get('/doctors', function(req, res) {
    // search range in meters (about a quarter mile). note it's not actually radius since im searching in a square
    const searchRange = 400;
    // url query string has latitude and longitude (in degrees)
    const ptLatitude = req.query.latitude;
    const ptLongitude = req.query.longitude;

    // https://stackoverflow.com/questions/2839533/adding-distance-to-a-gps-coordinate#2839560
    // (latitude runs north south. lines parallel to equator)
    const upperLatLimit = ptLatitude + (180/Math.PI)*(searchRange/6378137);
    const lowerLatLimit = ptLatitude - (180/Math.PI)*(searchRange/6378137);
    const upperLongLimit = ptLongitude + (180/Math.PI)*(searchRange/6378137)/Math.cos(Math.PI/180*ptLatitude);
    const lowerLongLimit = ptLongitude - (180/Math.PI)*(searchRange/6378137)/Math.cos(Math.PI/180*ptLatitude);

    // find doctors within specified range
    console.log("searching between latitudes (" + lowerLatLimit + ", " + upperLatLimit + ") and longitudes (" + lowerLongLimit + ", " + upperLongLimit + ")");
    // make this query actually works lol
    Doctor.find({ $and: [
            {$and: [{latitude: {$gt: lowerLatLimit}}, {latitude: {$lt: upperLatLimit}}]},
            {$and: [{longitude: {$gt: lowerLongLimit}}, {longitude: {$lt: upperLongLimit}}]},
        ] },
        (err, docs) => {
            // if all goes well, should have an array of all doctors within range here
        }
    );
});


app.listen(3000);
