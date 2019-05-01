import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

mongoose.connect('mongodb://localhost/sidewalkDoc');

const UserSchema = new mongoose.Schema({ });

UserSchema.pre('save', function(next) {
    if (this.password) {
        this.salt = new Buffer(crypto.randomBytes(16).toString('base64'),'base64');
        this.password = crypto.pbkdf2Sync(
            password, this.salt, 10000, 64).toString('base64');
    };
    next();
});

UserSchema.plugin(passportLocalMongoose);


const AlertSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  patient:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
    },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
    },
  tags: [{
    type: String
  }],
  description: String,
  latitude: Number,
  longitude: Number
});

const PatientSchema = new mongoose.Schema({
	name: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});
const DoctorSchema = new mongoose.Schema({
	name: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    latitude: Number,
    longitude: Number
});

mongoose.model('User', UserSchema);
mongoose.model('Alert', AlertSchema);
mongoose.model('Doctor', DoctorSchema);
mongoose.model('Patient', PatientSchema);
