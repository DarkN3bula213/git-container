import mongoose from 'mongoose';

const employeeModel = new mongoose.Schema({
   first_name: {
      type: String,
      required: true
   },
   last_name: {
      type: String,
      required: true
   },
   gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true
   },

   address: {
      type: String
      // required: true,
   },
   cnic: {
      type: Number
   },
   phone: {
      type: Number,
      required: true
   },
   dob: {
      type: Date
      // required: true,
      // set: (val) => {
      //   const [day, month, year] = val.split("/");
      //   return new Date(year, month - 1, day);
      // },
   },

   joining_date: {
      type: Date
   },
   package: {
      type: Number,
      required: true
   },
   status: {
      isActive: {
         type: Boolean,
         default: true
      },
      comments: {
         type: Array,
         default: []
      }
   }
});
