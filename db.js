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



// const Patient = new mongoose.Schema({
// 	name: String,
// 	updated_at: Date
// });
// const Doctor = new mongoose.Schema({
// 	name: String,
// 	updated_at: Date
// });

// "register" it so that mongoose knows about it
mongoose.model('User', UserSchema);
// mongoose.model('Cat', Cat);
