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



const PatientSchema = new mongoose.Schema({
	name: String,
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
  }
});
const DoctorSchema = new mongoose.Schema({
	name: String,
  // we can get a ptients location when they use the app but we always need to know a doctor's location
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
  },
  latitude: Number,
  longitude: Number,
  timeStamp: Date
  /*
  location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
  },
  */
});

/* since only doctors need location stored server side, im putting location/timestamp in the doctor model instead of separate location model (requires fewer db queries)
const LocationSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  timeStamp: Date
});
*/


// "register" it so that mongoose knows about it
mongoose.model('User', UserSchema);
mongoose.model('Patient', PatientSchema);
mongoose.model('Doctor', DoctorSchema);
//mongoose.model('Location', LocationSchema);
// mongoose.model('Cat', Cat);
