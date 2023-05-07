'use strict';
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { checkIfObjExists, renderIfExists } = require('../../utils/helpers');
const { getGithubAuthToken,getLinkedInToken,getFacebookToken}  = require('./endpoints');
const {frontendURL, backendURL, getFrontEndURL} = require('../../utils/setEnvs');
const { LogSignIn,LogAccountCreation } = require('../auditController/auditController');
const audit = require('../../models/Audit')
// const { GeneralAuditLog } = require('../auditController/auditController');

// const helpers = require('../utils/helpers');
// const constants = require('../utils/constants');


const defineRole = (email)=> process.env['ADMIN_ACCOUNTS'].split(',').includes(email)?'Admin':'Guest'

const jwtSign = (res,user,origin)=>{

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 10 },
      (err, token) => {
        if (err) {
          console.log('err at jwtSign',err)
          throw err
        }


        res.cookie('authCookie', `${token}redirectURI${frontendURL}`);

        const redirectURL = origin+`/login?token=${token}&tokenLength=${token.length}`;

        console.log('redirect url',redirectURL) 

        res.redirect(redirectURL);
      }
    );

}


// Get logged in user
const getLoggedInUser = async (req, res) => {
  try {
    let sign = req.query['sign']
    const user = await User.findById(req.user.id).select('-password');

    

    let device = req.headers["deviceinfo"];

    console.log('',device,req?.origin)

    let deviceData =( device && JSON.parse(device)) || {}

    // console.log('headers',deviceData,sign)

    sign && await audit.findOne({user:user?._id,type:'signup'}).then(async(userProfile)=>{
      // console.log('signup log for user',userProfile);
      if (!userProfile){
          await LogAccountCreation({user,deviceData})
          console.log('signup audit profile not found')
      }
      else{
        // console.log('signup audit profile found',userProfile)
        await LogSignIn({
          user,
          deviceData
        })
    
      }
    });

    


    if(sign){

      const payload = {
        user: {
          id: user.id,
        },
      };
  
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 36000 },
        (err, token) => {
          if (err) {
            console.log('err at jwtSign',err)
            throw err
          }
          else{
            const {email,firstName,alias,lastName,createdAt,updatedAt,role,_id,profileSetup}  =  user;
            res.json({
              alias,
              email,
              firstName,
              lastName,
              createdAt,
              updatedAt,
              token,
              role,
              _id,
              profileSetup
            })
      
          }
  
        }
      );

    }
    else{
      const {email,firstName,lastName,createdAt,updatedAt,profileSetup,alias,role,_id}  =  user
      res.status(200).json({
        email,
        alias,
        firstName,
        lastName,
        createdAt,
        updatedAt,
        role,
        _id,
        profileSetup
      })

    }

  } catch (err) {
    console.error('err at get user',err.message);
    res.status(500).send({
      error:'Server Error'
    });
  }
};

// Google callback
const googleAuthCallback = (req, res) => {
  try {
    //  Return the jsonwebtoken
    const isInapp = req.query['state'];

    const profile = req?.user;
    if(isInapp){

    const avatar = profile?.photos[0]?.value
      let payload =  {
        email: profile.emails.length ? profile.emails[0].value : 'none',
        firstName: `${profile?.name?.givenName}`,
        lastName:`${profile?.name?.familyName}`,
        googleGmailId:renderIfExists(profile?.emails?.find(email=>email?.verified)?.value),
        ...avatar?{avatar}:{}
      }
      let profileString= '';
      for (const key in payload) {
        if (Object.hasOwnProperty.call(payload, key)) {
          profileString+=`${key}=${payload[key]}&`
        }
      }

      // profileString+`provider=github`
      res?.redirect(backendURL+`/inapp?${profileString}`)
    }

    const hostUrl = `${req?.get('host')}`


    const originUrl = getFrontEndURL(hostUrl)



    jwtSign(res,profile,originUrl);
  } 
  catch (err) {
    console.log('err in google auth callback',err)
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


// Github callback
const githubAuthCallback = async(req, res) => {
  try {
    //  Return the jsonwebtoken
    const code = req.query['code'];
    
    //Query used to differentiate between sign in and fetching profile from app while signed in
    const path = req.query['path']
  
    let profile = await getGithubAuthToken({code});



    if(profile){
      if(path ==='/'){
        try {
          const {login,html_url} = profile
          let user = await User.findOne({ tenantId: profile.id });
          if (!user) {
            user = await new User({
              provider: 'github',
              tenantId: checkIfObjExists(profile,'id') ,
              email: checkIfObjExists(profile,'email'),
              username: checkIfObjExists(profile,'login'),
              avatar:checkIfObjExists(profile,'avatar_url'),
              alias:renderIfExists(login),
              githubProfileUrl: renderIfExists(html_url),
            }).save();
          }

          const hostUrl = `${req?.get('host')}`

          const originUrl = getFrontEndURL(hostUrl)

          // console.log('host url and origin at github',hostUrl,backendURL, backendURL.includes(hostUrl) )
          

          jwtSign(res,user,originUrl)

          
        } 
        catch (err) {
          console.log('err at fetch user',err);
        }
      }
      else{

        let cookieVal =encodeURI(JSON.stringify(profile)); 

        const firstName = profile?.name && profile?.name !=='null'? profile?.name?.split(' ')[0]:'';

        const lastName = profile?.name && profile?.name !=='null' && profile?.name?.split(' ')?.length >1 ? profile?.name?.split(' ')[1]:'';


        
        const payload = {
          ...profile.login ?{alias:profile.login}:{},
          ...profile?.avatar_url? {avatar:profile.avatar_url}:{},
          ...lastName?{lastName}:{},
          ...firstName?{firstName}:{},
          ...profile?.twitter_username?{twitterProfileUrl:profile?.twitter_username}:{},
          ...profile?.html_url?{githubProfileUrl:profile?.html_url}:{},
          ...profile?.email && profile?.email !=='null'?{email:profile?.email}:{},
          provider:'github',
        }

        let profileString= '';
        for (const key in payload) {
          if (Object.hasOwnProperty.call(payload, key)) {
            profileString+=`${key}=${payload[key]}&`
          }
        }

        // profileString+`provider=github`


        res.cookie('profileCookie', cookieVal);
        console.log('in app',JSON.parse(decodeURI(cookieVal)))
        res?.redirect(backendURL+`/inapp?${profileString}`)
      }
    }
    else{
      res.status(500).send(profile)
    }

  } catch (err) {
    console.error('err at github callback',err);
    res.status(500).send('Server error');
  }
};

// Linkedin auth callback
const linkedinAuthCallback = async(req,res)=>{
  try{
    const code = req.query['code'];
    let state = req.query['state'];

    console.log('code and state',req.query);

    let profile = await getLinkedInToken(code);

    console.log('linkedinuser',profile)

    const profilePayload =  {
      lastName:profile?.localizedLastName,
      firstName:profile?.localizedFirstName,
      avatar:profile?.profilePicture?.displayImage,
      // tenantId:profile?.id,
      provider:'linkedin',
      backendURL
    }

    if(state==='-inapp'){
    
      let profileString= '';
      for (const key in profilePayload) {
        if (Object.hasOwnProperty.call(profilePayload, key)) {
          profileString+=`${key}=${profilePayload[key]}&`
        }
      }
      // profileString+`provider=linkedIn`

      console.log('profileString',profileString)

      res?.redirect(backendURL+`/inapp?${profileString}`)

    }


    else{
      let user =await User.findOne({ tenantId: profilePayload.tenantId });

      if (!user) {
        user = await new User(profilePayload).save();
      }
      const hostUrl = `${req?.get('host')}`

      const originUrl = getFrontEndURL(hostUrl)



      jwtSign(res,user,originUrl)


    }



  }
  catch(err){
    console.log('error at linkedinAuthController',err)

  }
}

// Microsoft callback
const microsoftAuthCallback = (req, res) => {
  try {
    const hostUrl = `${req?.get('host')}`

    let user = req.user;

    const originUrl = getFrontEndURL(hostUrl)


    jwtSign(res,user,originUrl);

  } catch (err) {
    console.error('err at microsoft auth callback',err);
    res.status(500).send('Server error');
  }
};


const faceBookAuthCallback = async(req,res)=>{
  try{

    const code = req.query['code'];

    let state = req.query['state'];

    let getFaceBookUser  =  await getFacebookToken(code);

    let user = getFaceBookUser.data;


    console.log('returned facebook user',user)

    const facebookUser =  {
      avatar:  state==='-inapp'? encodeURIComponent(user?.picture?.data?.url) :user?.picture?.data?.url,
      googleGmailId: user?.email,
      firstName: user?.first_name,
      lastName: user?.last_name,
      ...state==='-inapp'? {}:{tenantId: user?.id},
      provider:'facebook'      
    }
    if(state==='-inapp'){

    
      let profileString= '';
      for (const key in facebookUser) {
        profileString+=`${key}=${facebookUser[key]}&`
      }

      console.log('profileString',profileString)

      res?.redirect(backendURL+`/inapp?${profileString}`)

    }
    else{
      let user =await User.findOne({ tenantId: facebookUser.tenantId });

      if (!user) {
        user = await new User(facebookUser).save();
      }


      const originUrl = req['header']('Referer')
    

      jwtSign(res,user,originUrl)


    }


  }
  catch(err){
    console.log('error at facebook auth callback',err);
    res.status(500).send('Server error');
  }
}


module.exports = {
  getLoggedInUser,
  googleAuthCallback,
  githubAuthCallback,
  microsoftAuthCallback,
  defineRole,
  linkedinAuthCallback,
  faceBookAuthCallback
};
