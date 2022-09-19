// importing modules needed to authorize user
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// importing User database model to authorize user
const { User } = require('../models');


//Handler function to wrap each route. 
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      // Forward error to the global error handler
      next(error);
    }
  }
}

// this function is to authorize users that make requests
async function authorizeUser(req, res, next){
  // Holds error message if needed.
  let errorMessage = null;
   
  // checks user credentials from HTTP authorization header
  const cred = auth(req);

  //if request object has authorization header
   if (cred) {
     const user = await User.findOne({
       attributes: ['id', 'firstName', 'lastName', 'emailAddress', 'password'],
       where: {
         emailAddress: cred.name
       },
       raw: true
     });

     if(user){
       //checks to see if given password matches what is stored in database
       const authorized = bcryptjs.compareSync(cred.pass, user.password);

       if(authorized){
        req.currentUser = user; // makes user currentUser of request object.
       }else{
         errorMessage = `The username ${cred.name} could not be authenticated`;
       }
     }else{
       errorMessage = `The username ${cred.name} could not be found`;
     }

   }else{
     errorMessage = "Authorization header not detected";
   }

   // this is true if an authorization header was
   // not detected and an error message was produced
   if(errorMessage){
     res.status(401).json({errorMessage: 'Access Not Authorized'})
   }else{
     next(); // Goes to next middleware function if access authorized
   }

};

module.exports = {asyncHandler, authorizeUser}


