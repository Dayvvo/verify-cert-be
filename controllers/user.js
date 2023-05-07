const User  = require('../models/user')
const bcrypt =  require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {

    // Our register logic starts here
     try {
      // Get user input
      const { firstName, lastName, email, password,staffId,department } = req.body;
  
      // Validate user input
      if (!(email && password && firstName && lastName && staffId)) {
        res.status(400).send("All input is required");
      }
  
      // check if user already exist
      // Validate if user exist in our database
      const oldUser = await User.findOne({ email });
  
      if (oldUser) {
        return res.status(409).send("User Already Exist. Please Login");
      }
  
      //Encrypt user password
      encryptedUserPassword = await bcrypt.hash(password, 10);
  
      // Create user in our database
      const user = await User.create({
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        password: encryptedUserPassword,
        department,
        staffId
      });
  
      // Create token
      const token = jwt.sign(
        { user_id: user._id, staffId },
        process.env.TOKEN_KEY,
        {
          expiresIn: "5h",
        }
      );
      // save user token
      user.token = token;
  
      // return new user
      res.status(201).json(user);
    } catch (err) {
      console.log(err);
    }
    // Our register logic ends here
};


const login  = async (req, res) => {

    // Our login logic starts here
     try {
      // Get user input
      const { staffId, password } = req.body;
  
      // Validate user input
      if (!(staffId && password)) {
        return res.status(400).send("All input is required");
      }
      // Validate if user exist in our database
      const user = await User.findOne({ staffId });

  
      if (user && (await bcrypt.compare(password, user.password))) {
        // Create token
        const token = jwt.sign(
          { user_id: user._id, staffId },
          process.env.TOKEN_KEY,
          {
            expiresIn: "5h",
          }
        );
  
        // save user token
        user.token = token;
  
        // user
        return res.status(200).json(user);
      }
      else{
        return res.status(400).json({
            status:'error',
            data:"Invalid Credentials"
        });
      }
      
    // Our login logic ends here
     }
     catch(err){
        console.log('an error occured',err)

     }
     
};
  


module.exports = {
    register,
    login
}
  