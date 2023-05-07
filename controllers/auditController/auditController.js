const Audit = require('../../models');
// const UserStamps = require('../models/UserStamps');
const { LogToSplunk } = require('./endpoints');
const auditModel  = require('../../models')
const User = require('../../models/User');
const { RETURN_EMAIL_HIERARCHY } = require('../../utils/constants');




//controller functions

const LogSignIn = async({user,deviceData})=>{

    try{

        let userName = user?.alias || user?.googleGmailId || `${user?.firstName} ${user?.lastName}`;
        
        let {device} = deviceData;

        const deviceMetaData = `${device?.browserName} ${device?.clientType} ${device?.engineVersion}`;
        
        const auditModelPayload = {
            "user":user?._id,
            "type":"Login",
            "description":`${userName} signed in successfully with ${deviceMetaData}`,
            "deviceData":deviceMetaData,
        }

        let newLoginAudit = await new Audit(auditModelPayload).save();

        await LogToSplunk(auditModelPayload)

        // console.log('new audit record',newLoginAudit)
        return {
            deviceId:newLoginAudit?.deviceID,
            deviceData: newLoginAudit?.deviceData
        }
    

    }
   
    catch(err){
        console.log('err at auditLog signup',err)
        return {err}

    }
}


const LogAccountCreation = async({user,deviceData})=>{

    try{

        
        let {device} = deviceData;

        const deviceMetaData = `${device?.browserName} ${device?.clientType} ${device?.engineVersion}`;

        // let newDeviceStamp = null;
        let auditpayload = {
            user:user?._id,
            type:'signup',
            description:`A new user signed up successfully with ${user?.provider}`,
            deviceData:deviceMetaData
        }

        await LogToSplunk(auditpayload);

        let newLoginAudit = await new Audit(auditpayload).save();

        console.log('new audit signup record',newLoginAudit);
        

        return {
            deviceId:newLoginAudit?.deviceID,
            deviceData: newLoginAudit?.deviceData,
        };
    
    }
    catch(err){
        console.log('err at logging signup',err)
        return {err}

    }
}


const GeneralAuditLog = async({user,deviceData,type,descriptionText})=>{

    try{


        let userName = user?.alias || `${user?.firstName} ${user?.lastName}`;
        
        let {device} = deviceData || {};

        const deviceMetaData = `${device?.browserName} ${device?.clientType} ${device?.engineVersion}`;

        const description = type==='update'? 
         `${userName}'s account was updated`:type==='signup'?
         `A new user created an account on ${user?.createdAt}`:
         type==='profile-setup'?`${userName} created a profile`:
         descriptionText;
        
        let auditpayload = {
            user:user?._id,
            type,
            description,
            ...device?{deviceData:deviceMetaData}:{},
        }

        await LogToSplunk(auditpayload);

        let newLoginAudit = await new Audit(auditpayload).save();


        
        console.log('new general audit record',newLoginAudit);

        return {
            deviceId:newLoginAudit?.deviceID,
            deviceData: newLoginAudit?.deviceData
        };
    }
    catch(err){
        return {err}
    }
}


const fetchAudits = async(req,res)=>{
    try{
        const query = req?.query?.limit;

        const daysVal = query==='today'? 0: query==='2days'? 2 : query==='7days'? 7 : query==='1month'? 30: null;

        const dateV = new Date(); 

        dateV.setHours(0,0,0,0);

        const dateValue = new Date(dateV.setDate(dateV.getDate() - daysVal));

        //return name of work email field
        let userOrgEmail = RETURN_EMAIL_HIERARCHY().emailList[0];

        const getUser = await User.findOne({_id:req?.user?.id});
        
        //find audit queries sort by date in descending order
        const AuditRecords = await Audit.find({
            createdAt:{$gte: dateValue},
            $or:[
            
                {provider:{$exists:false}},
                {webhookCreator:getUser[userOrgEmail]},
                {webhookAssignedTo:getUser[userOrgEmail]}
            ]
        }).sort({createdAt:-1}).limit(60)
        // populate only the following fields in the user field retuned
        .populate([{path:'user',select:`firstName lastName alias avatar ${userOrgEmail}`}])

        console.log('audit records returned',AuditRecords)

        if(!AuditRecords){
            return res.status(400).json({
                msg: "No audit records not found",
            });        
        }
        res.json(AuditRecords);
    }
    catch(err){
        console.log('error message',err)
        res.status(500).send('Server error')
    }
}

const fetchUserActivity = async(req,res)=>{
    try{
        console.log('logged in user',req.user)


        // get list of office emails 
        let emails = RETURN_EMAIL_HIERARCHY().emailList;

        res.json({
            user:{
                'name':'davis'
            }
        })
    }
    catch(err){
        console.log('err at fetching user actviity',err)
    }
}

module.exports = {
    LogSignIn,
    LogAccountCreation,
    GeneralAuditLog,
    fetchAudits,
    fetchUserActivity
}
