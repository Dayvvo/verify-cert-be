const KV = 'kv-peepsdb';

const GITHUB_CLIENT_ID = 'GITHUB-CLIENT-ID';
const GITHUB_CLIENT_SECRET = 'GITHUB-CLIENT-SECRET';

const GOOGLE_CLIENT_ID = 'GOOGLE-CLIENT-ID';
const GOOGLE_CLIENT_SECRET = 'GOOGLE-CLIENT-SECRET';

const MICROSOFT_CLIENT_ID = 'MICROSOFT-CLIENT-ID';
const MICROSOFT_CLIENT_SECRET = 'MICROSOFT-CLIENT-SECRET';

const MONGO_URI = 'MONGO-URI';
const JWT_SECRET = 'JWT-SECRET';

const APP_ROLES = {
  'Guest':1,
  'Freelancer':2,
  'Staff':3,
  'Admin':4,
  'Super-Admin':5
}

const EMAIL_HIERARCHY = 'sjultra.com vzxy.net';

//convert list company emails into javascript object and mongoose model fields
const RETURN_EMAIL_HIERARCHY = ()=>{

  const emailObjectValues = {};
  const emailModel = {};
  const split = EMAIL_HIERARCHY.split(' ');

  split.forEach((entry,index)=>{
    emailObjectValues[`email${index+1}`] = entry;
  });

  Object.keys(emailObjectValues).forEach((entry)=>{
    emailModel[entry] = {
      type:String
    };
  })

  return {
    value:emailObjectValues,
    emailList: Object.keys(emailObjectValues),
    
    model:emailModel
  }

}



module.exports = {
  KV,
  GITHUB_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MONGO_URI,
  JWT_SECRET,
  APP_ROLES,
  RETURN_EMAIL_HIERARCHY
};
