import mongoose from 'mongoose';
import passport from 'passport';
require( './db' );
require( './auth' );
const User = mongoose.model("User");
const Alert = mongoose.model("Alert");
const Patient = mongoose.model("Patient");
const Doctor = mongoose.model("Doctor");
const ObjectId = require('mongoose').Types.ObjectId;
let patient;
const description = "test alert";

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
		user.authenticate(password).then((e) => {
			console.log(e.error);
			if (e.error !== undefined) {
				return done(null, false);
			} else {
				return done(null, user);
			}
		});
    });
}));

function addPatient(pt) {
    User.register(new User({username: pt.username}), pt.password, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            const typedUser = new Patient({
                name: pt.username,
                user: user._id
            });
            typedUser.save((e, pat) => {
                console.log(pt.username + " created");
                pt.alert.patient = pat._id;
                pt.alert.save(() => {console.log(pat.name + "'s alert created")});
            });
        }
    });
}
function addDoctor(doc) {
    User.register(new User({username: doc.username}), doc.password, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            const typedUser = new Doctor({
                name: doc.name,
                user: user._id,
                latitude: doc.latitude,
                longitude: doc.longitude
            });
            typedUser.save((e) => {
                console.log(doc.username + " created");
            });
        }
    });
}

const alert1 = new Alert({
  description: description,
  latitude: 40.731452,
  longitude: -73.997839
  // severity:severity,
  // tags: tags,
});
const alert2 = new Alert({
  description: description,
  latitude: 40.728883,
  longitude: -73.990844
  // severity:severity,
  // tags: tags,
});
const alert3 = new Alert({
  description: description,
  latitude: 40.735339,
  longitude: -73.990694
  // severity:severity,
  // tags: tags,
});

const patient1 = {
    username: "patient1",
    password: "test",
    alert: alert1
};
const patient2 = {
    username: "patient2",
    password: "test",
    alert: alert2
};
const patient3 = {
    username: "patient3",
    password: "test",
    alert: alert3
};

const doctor1 = {
    username: "doctor1",
    password: "test",
    type: "doctor",
    latitude: 40.733428,
    longitude: -73.993684
};
const doctor2 = {
    username: "doctor2",
    password: "test",
    type: "doctor",
    latitude: 40.725720,
    longitude: -73.993191
};
const doctor3 = {
    username: "doctor3",
    password: "test",
    type: "doctor",
    latitude: 40.733279,
    longitude: -73.977406
};

User.deleteMany({}, function() {
    Doctor.deleteMany({}, function() {
        Patient.deleteMany({}, function() {
            Alert.deleteMany({}, function() {
                addPatient(patient1);
                addPatient(patient2);
                addPatient(patient3);
                addDoctor(doctor1);
                addDoctor(doctor2);
                addDoctor(doctor3);
            });
        });
    });
});
