const azureVault = require('./azure-vault');
const crypto =require('crypto')
const {S3Client,PutObjectCommand}  = require('@aws-sdk/client-s3')
const AWS = require('aws-sdk');


const Bucket = process.env['S3_BUCKET'];
const region = process.env['S3_BUCKET_REGION'];
const accessKeyId = process.env['S3_BUCKET_USER'];
const secretAccessKey = process.env['S3_BUCKET_USER_KEY'];


const s3Instance = new S3Client({
  credentials:{
    accessKeyId,
    secretAccessKey
  },
  region
})



const s3UploadImg = async({img,id})=>{

  // Configure AWS to use promise
  AWS.config.setPromisesDependency(require('bluebird'));
  AWS.config.update({ accessKeyId, secretAccessKey, region });

  // Create an s3 instance
  const s3 = new AWS.S3();

  let avatarSlice = img?.split(';base64');

  
  // The upload() is used instead of putObject() as we'd need the location url and assign that to our user profile/database
  // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
  let location = '';
  let Key = '';
  try {

    const uploadImgRequest = await s3.upload({
      Bucket,
      Key:uuidv4()+id,
      Body:img,
      ContentEncoding:'base64',
      ACL:'public-read',
      ContentType:avatarSlice[0]
    }).promise();

    const {Location,Key} = uploadImgRequest
    
    location = Location,
    key = Key
  } 
  catch (error) {
    console.log( 'error at uploading to s3', error)
  }
  
  console.log('location and key',location, Key);
  
  
  
}


const uploadImgToS3  = async({img})=>{

  try{

    console.log('triggering upload to s3',img?.charAt(1))
    let avatarSlice = img?.split(';base64');

    console.log('secret Access key',secretAccessKey,avatarSlice[0])

    // console.log('avatarSlice',avatarSlice)

    const Key= uuidv4()+ `-${new Date()}`;

    // console.log('avatar',avatarSlice[0]);

    const putCommand = new PutObjectCommand({
      Bucket,
      Key,
      Body:img,
      ContentEncoding:'base64',
      ACL:'public-read',
      ContentType:avatarSlice[0]

    })

    const data = await s3Instance.send(putCommand)
    
    console.log('upload data',data)
    // const {} = sendCommand;
    return {
      Key,
      data
    }
  }
  catch(err){
    console.log('err at uploading to s3',err)
    return{
      error:err
    }

  }

}


const replaceDashWithLowDash = (string) => {
  return string.replace('-', '_');
};

const getEnvVariable = async (variableName, vaultName) => {
  if (process.env.ENVIRONMENT && process.env.ENVIRONMENT === 'DEV')
    return process.env[replaceDashWithLowDash(variableName)];
  return azureVault.getSecret(variableName, vaultName);
};

const checkIfObjExists = (obj,entry,fallBack=null)=> obj[entry]?obj[entry]:fallBack;

const renderIfExists = (entry,fallBack='')=>entry?entry:fallBack





const linkRegex = new RegExp(
	'^(https?:\\/\\/)?' + // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
		'(\\#[-a-z\\d_]*)?$',
	'i'
)



const uuidv4 =() =>
  crypto.randomBytes(32)+
  Math.random().toString(36).substring(2, 15)+ `${Date.now().toString(36)} + `


const stringToBase64Enc = (data) => {
    return Buffer.from(data).toString('base64');
}
    

module.exports = {
  getEnvVariable,
  checkIfObjExists,
  renderIfExists,
  linkRegex,
  uuidv4,
  uploadImgToS3,
  s3UploadImg,
  stringToBase64Enc
};






