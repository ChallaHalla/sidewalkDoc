import mongoose from 'mongoose';
require( './db' );
require( './auth' );
const User = mongoose.model("User");
const Alert = mongoose.model("Alert");
const Patient = mongoose.model("Patient");
const Doctor = mongoose.model("Doctor");
let patient;
const description = "test alert";
Alert.remove({}, ()=>{
  Patient.find({},(err, patients)=>{
  const alert = new Alert({
    description: description,
    latitude: 37.740195,
    longitude: -122.500305,
    patient: patients[0]._id
    // severity:severity,
    // tags: tags,
  });
  const alert2 = new Alert({
    description: description,
    latitude: 37.798815,
    longitude: -122.435074,
    patient: patients[1]._id
    // severity:severity,
    // tags: tags,
  });
  const alert3 = new Alert({
    description: description,
    latitude: 37.796526,
    longitude: -122.280579,
    patient: patients[2]._id
    // severity:severity,
    // tags: tags,
  });
  const alert4  = new Alert({
    description: description,
    latitude: 37.487935,
    longitude: -122.378190,
    patient: patients[2]._id,
    // severity:severity,
    // tags: tags,
  });
  alert.save();
  alert2.save();
  alert3.save();
  alert4.save();
})}
);
