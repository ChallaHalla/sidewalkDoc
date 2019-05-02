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

	req.body = JSON.parse(Object.keys(req.body)[0]);

	const description = req.body.description;
	const severity = req.body.severity;
	const location = {
		latitude: req.body.latitude,
		longitude: req.body.longitude
	};
	const userId = req.body.userId;

	// let tags = req.body.tags;
	// tags = tags.substring(1,tags.length-1).split(",");

	// const patient = findTypedUser(userId,"patient");
	// REPLACE THIS WITH findTypedUser
	Patient.findOne({user:userId},(err,patient)=>{
		const alert = new Alert({
			description: description,
			latitude: location.latitude,
			longitude: location.longitude,
			patient: patient._id
			// severity:severity,
			// tags: tags,
		});
		console.log(alert);
		alert.save((e)=>{
			res.json({
				"status": "success"
		});
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
				console.log('here');
				console.log(user);
				// find typedUser associated with user acct
				function typedUserResponse(err, typedUser){
					if(err || typedUser === null){
						res.json({
							status:"incorrect credentials"
						});
					} else{
						req.session.typedUser = typedUser;
						console.log("made it");
						console.log(typedUser);
						res.json({
							"status": "success",
							"userId": user._id,
						});
					}
				}
				if(req.body.doctor === "on"){
					Doctor.findOne({user:user._id}, typedUserResponse);
				}
				else if(req.body.patient === "on"){
					Patient.findOne({user:user._id}, typedUserResponse);
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
			console.log(err);
			res.json({
				status:"error"
			});
    } else {
      passport.authenticate('local')(req, res, function() {
				// create doctor or patient object and place user within here
				let typedUser;
				console.log
				if(req.body.patient === "on"){
					console.log("HERE");
					typedUser = new Patient({
						name:name,
						user: user._id,
					});
				}else if(req.body.doctor == 'on'){
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
						status:"account created",
						userId: user._id,
					});
				});
      });
    }
  });
});

// doctor sends their ID and location in url. name them: doctorID, latitude, and longitude
app.get('/updateDocLocation', function(req, res) {
    Doctor.findById(req.query.doctorID, function(err, doc) {
        if (err) {
            res.json({status: "error"});
        } else {
            doc.latitude = req.query.latitude;
            doc.longitude = req.query.longitude;
            doc.save(function(err, doc) {
                if (err) {
                    res.json({status: "error"});
                } else {
                    console.log(doc.name + " location updated to " + doc.latitude + ", " + doc.longitude);
                    res.json({status: "success"});
                }
            });
        }
    });
});

// NOTE: send lat and long as decimal degress, NOT degrees, minutes, seconds
app.get('/nearbyAlerts', function(req, res) {
		console.log("finding nearby alerts");
    // search range in meters (about a quarter mile). note it's not actually radius since im searching in a square
    const searchRange = 3000;
    // url query string has latitude and longitude (in degrees)
    const docLatitude = Number(req.query.latitude);
    const docLongitude = Number(req.query.longitude);

    // https://stackoverflow.com/questions/2839533/adding-distance-to-a-gps-coordinate#2839560
    const latRange = Math.abs((180/Math.PI)*(searchRange/6378137));
    var upperLatLimit = docLatitude + latRange;
    var lowerLatLimit = docLatitude - latRange;
    const longRange = Math.abs((180/Math.PI)*(searchRange/6378137) / Math.cos(Math.PI/180*docLatitude));
    var upperLongLimit = docLongitude + longRange;
    var lowerLongLimit = docLongitude - longRange;
    upperLatLimit = Math.round(upperLatLimit*1000000) / 1000000;
    lowerLatLimit = Math.round(lowerLatLimit*1000000) / 1000000;
    upperLongLimit = Math.round(upperLongLimit*1000000) / 1000000;
    lowerLongLimit = Math.round(lowerLongLimit*1000000) / 1000000;

    console.log("searching between latitudes (" + lowerLatLimit + ", " + upperLatLimit + ") and longitudes (" + lowerLongLimit + ", " + upperLongLimit + ")");
    // find alerts within range of this doctor (and that do not have a doctor already assigned)
    // make sure this query actually works lol
    Alert.find({ $and: [
            {latitude: {$gt: lowerLatLimit, $lt: upperLatLimit}},
            {longitude: {$gt: lowerLongLimit, $lt: upperLongLimit}},
            {doctor: null}
        ] },
        (err, alerts) => {
					console.log(alerts);
            res.json({
						status:"success",
						alerts:alerts
						});
        }
    );
});

// endpoint for assigning a doctor to an alert.
    // sent by doctor, request contains both doctor's User objectID and chosen Alert's objectID
    // this is a POST because it is making changes server side, but a GET would probably work just as well
app.post('/respondToAlert', function(req, res) {
    req.body = JSON.parse(Object.keys(req.body)[0]);
    Alert.findById(req.body.alertID, function(err, alert) {
        alert.doctor = req.body.doctorID;
        alert.save(function(err, al) {
            console.log("updated alert with doc");
            console.log(al);
            res.json({"status": "success"});
        });
    });
});

function findTypedUser(userId, userType){
	console.log("HERE");
	User.findOne({_id:userId},(err,user)=>{
		console.log("FOUND USER",err,user);
		if(userType === "patient"){
			Patient.findOne({user:user._id},(err,patient)=>{
				console.log("FOUND PATIENT",err,patient);
				return patient;
			});
		} else if(userType === "doctor"){
			Doctor.findOne({user:user._id},(err,doctor)=>{
				return doctor;
			});
		}
	});
}


app.listen(3000);
