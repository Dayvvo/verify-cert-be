const axios = require('axios').default;
const { jiraPAT } = require('../../utils/setEnvs');
const Audit  = require('../../models')
const Exception  = require('../../models/ErrExceptions')


const config = {
    headers: {
        Authorization: `Basic ${jiraPAT}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }
};


//helper functions

const jiraRequest = axios.create({
    baseURL:`${process.env['JIRA_DOMAIN']}rest/api/3/`,
    ...config
})


const transformJiraPayload = async(body,type)=>{
    try {
        let {webhookEvent,issue,user,comment} = body

        const eventType = webhookEvent;

        const {fields} = issue || {};

        // get email of jira user by using the jira /user endpoint
        const getDesignatedEmail = async(eventType,type)=>{

            try{

                let userObject = eventType.includes('issue')?user:
                eventType.includes('comment')?comment:fields?.assignee

                // console.log('event type and userobj',eventType,userObject)

                let {accountId} =  userObject || {};
                
                let req = await jiraRequest.get(`user?accountId=${accountId}`);                

                let {data} = req;

                
                console.log('user',data);

                return data?.emailAddress
            
            }
            catch(error){
                console.log('err at getting issue reporter',error,type)

                return ''
            }


        }


        const linkToEvent = process.env['JIRA_DOMAIN']+ `browse/${issue?.key}`

        const webhookCreator = await getDesignatedEmail(eventType,'issue-creator');
        
        const webhookAssignedTo  = await getDesignatedEmail('assignee','issue-assignee');

        // title/summary for issue
        const itemTitle = fields?.summary;     
       
        // getting event type format is webhook-provider:eventType i.e webhook-jira:issue_created
        const type = `webhook-${eventType}`

        const eventPayload=JSON.stringify(body);

        const jiraPayload = {
            provider:'jira',
            webhookCreator,
            webhookAssignedTo,
            itemTitle,
            eventPayload,
            linkToEvent,
            type
        }

        console.log('jira transformed payload',jiraPayload);

        const saveWebhoook = await Audit.findOneAndUpdate({linkToEvent},jiraPayload,
            {new:true,setDefaultsOnInsert:true},
            async(err,doc)=>{
                
                if (!err && !doc){
                   let newDoc =  await new Audit(jiraPayload).save();
                   return newDoc
                }
                else if (doc){
                    console.log('webhook doc found',doc);
                }
            }
        )
        console.log('webhook saved',saveWebhoook);
        // await new Audit(jiraPayload).save()


    } 
    catch (error) {
        console.log('errr at transforming jira payload',error)

        await new Exception({
            errObject:(error?.toString()),
            errResponse:(error?.response?.toString()),
            errData: (error?.response?.data?.toString()),
            errSource: 'jira webhook transforming payload'
        }).save()

    }
}



//requests
const getAllLabels = async (req, res) => {

      try{
        let request = await jiraRequest.get(`label`);
        let {data} =request;        
        return res.json(data);
      }
 
      catch(err){
        console.log('jira fetch error',err?.response?.statusText)
        return res.status(500).json({
            error:'Oops, an error occured'
        })
      }
    

}

const getLabelIssues = async(req,res)=>{
    try{
        let startAt = req.query['start'];
        const label = req.query['label'];
        const request = await axios.get(
            `${process.env['JIRA_DOMAIN']}rest/api/3/search?jql=labels%20IN%20(%22${label}%22)&startAt=${startAt}&maxResults=100`,
        config);
        const {data} = request;
        return res.json(data);
    }
    catch(err){
        console.log('jira fetch label issues error',err)
        return res.status(500).json({
            error:'Oops, an error occured'
        })

    }

}
const getAllIssues = async(req,res)=>{
    try{
        let startAt = req.query['start'];
        const request = await axios.get(
            `${process.env['JIRA_DOMAIN']}/rest/api/3/search?startAt=${startAt}&maxResults=100`,
        config);
        const {data} = request;
        // console.log('all issues data',data)
        return res.json(data);

    }
    catch(err){
        console.log('jira fetch issues',err)
        return res.status(500).json({
            error:'Oops, an error occured'
        })

    }

}

const jiraWebhookController = async(req,res)=>{
    try{
        
        const body = req['body'];

        console.log('jira webhook payload',body);
            
        body?.issue && await transformJiraPayload(body)

        res.status(200).send('successful');

    }
    catch(error){
        console.log('webhook endpoint failed',error);

        await new Exception({
            errObject:(error?.toString()),
            errResponse:(error?.response?.toString()),
            errData: (error?.response?.data?.toString()),
            errSource: 'jira receiving webhook payload'
        }).save()
        res.status(200).send('successful');

    }
}

module.exports ={
    getAllLabels,
    getLabelIssues,
    getAllIssues,
    jiraWebhookController
}