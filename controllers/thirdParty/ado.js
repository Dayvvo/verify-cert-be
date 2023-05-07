const { stringToBase64Enc } = require('../../utils/helpers');
const Audit = require('../../models');
const User = require('../../models/User');
const ErrExceptions = require('../../models/ErrExceptions');
const { RETURN_EMAIL_HIERARCHY } = require('../../utils/constants');

const axios = require('axios').default;

const baseAdoUrl = process.env['AZURE-API']

const getAdoProjects=  async(req,res)=>{
    try{
        const personalAccessToken = process.env['ADO-PAT'];
        const patBase64 = stringToBase64Enc(':' + personalAccessToken);
        
        // Set Config
        const config = {
          headers: {
            Authorization: `Basic ${patBase64}`,
            'Content-Type': 'application/json',
          },
        };
        const res = await axios.get(
            baseAdoUrl+'_apis/projects?api-version=7.0',config);

        const {data} = res;

        console.log('my apps',data);

        return res.json(data);

        
    }
    catch(err){
        console.log('azure devops fetch error',err?.response)
        return res.status(500).json({
            error:'Oops, an error occured'
        })

    }
}

//CONTROLLER HELPER FUNCTIONS

const transformADOPayload = async(body)=>{

    try{

        const {resource:resourceField,eventType} = body;


        const getDesignatedEmail =  (str)=>typeof(str) === 'string'?  str?.split(' ').pop().split('<')?.pop()?.split('>').shift(): 'unassigned' ;
        

        const getEventMetaData = async()=>{

            const resource = eventType==='workitem.created'?resourceField: resourceField?.revision


            // console.log('event type and resource',eventType,resourceField)

            const id = eventType==='workitem.created'?resourceField?.id:resourceField?.workItemId;

            const teamProject = resource?.fields['System.TeamProject'] ;

            const linkToEvent = `${baseAdoUrl}${teamProject}/_workitems/edit/${id}`;

           
            const webhookCreator = getDesignatedEmail(resource?.fields['System.CreatedBy']);

            const webhookAssignedTo = getDesignatedEmail(resource?.fields['System.AssignedTo'])
        
            const itemTitle = (resource?.fields['System.Title']);    

            const type = `webhook-ado:${eventType}`
    
            // const eventPayload=JSON.stringify(body);


            const primaryEmail = RETURN_EMAIL_HIERARCHY().emailList[0];


            let webhookCreatorDisplayName = await User.findOne({
                [primaryEmail]:webhookCreator,
            }).then(profile=>{
                let displayName = '';
                if (profile){
                    displayName =  `${profile?.firstName} ${profile?.lastName}`  
                }
                else{
                    displayName = ``;
                }
                return displayName;                  
            })

            console.log('webhookCreator display name',webhookCreatorDisplayName)



            return {
                itemTitle,
                linkToEvent,
                webhookCreator,
                webhookAssignedTo,
                type,
                webhookCreatorDisplayName
            }

        }

        const {linkToEvent} = await getEventMetaData()

        const newMeta = await getEventMetaData()

        const eventPayload=JSON.stringify(body);


        console.log('metaData',newMeta)


        const adoPayload = {
            provider:'azure-devops',
            eventPayload,
            ...newMeta,
        }

        console.log('ado payload',adoPayload)
        

        
        const saveWebhoook = await Audit.findOneAndUpdate({linkToEvent},adoPayload,
            {new:true,setDefaultsOnInsert:true},
            async(err,doc)=>{
                
                if (!err && !doc){
                   console.log('doc not found')
                   let newDoc =  await new Audit(adoPayload).save();
                   return newDoc
                }
                else if (doc){
                    console.log('webhook doc found',doc?._id);
                }
            }
        )
        console.log('webhook saved',saveWebhoook);


    }
    catch(error){
        console.log('err at transforming data payload',error)
        await new ErrExceptions({
            errObject:JSON.stringify(error),
            errResponse:JSON.stringify(error?.response),
            errData: JSON.stringify(error?.response?.data),
            errSource: 'ado webhook transforming payload'
        }).save()

    }



    
}


//CONTROLLERS 
const workItemCreatedWebHook = async(req,res)=>{
    try{

        // console.log('webhook payload body',req['body'])

        const body = req['body']

        const query = req.query['type'];

        // console.log('webhook body',JSON.stringify(body));

        
        await transformADOPayload(body)

        // console.log(query,'webhook saved at',new Date().toString(),)
        
        res.status(200).send(body);

    }
    catch(error){
        console.log('webhook failed error',error)
        // res.send("webhook failed",err)

        await new ErrExceptions({
            errObject:JSON.stringify(error),
            errResponse:JSON.stringify(error?.response),
            errData: JSON.stringify(error?.response?.data),
            errSource: 'ado receiving webhook payload'
        }).save()

        res.status(200).send('received');

    }
}


module.exports = {
    getAdoProjects,
    workItemCreatedWebHook,
    transformADOPayload
}





// const dummyPayload = {
//     "subscriptionId":"15a97358-60c7-481e-a07a-108ea62620e3",
//     "notificationId":36,"id":"e906afb7-9980-4603-b69f-96e2a1450df0",
//     "eventType":"workitem.updated","publisherId":"tfs",
//     "message":{"text":"Issue #532 (Webhook new update added4) assigned to Oluwakemi Dada by David Adeyemi\r\n(https://dev.azure.com/sjultra/web/wi.aspx?pcguid=29bee7ee-1988-4f75-b70c-ea76680ea922&id=532)",
//     "html":"<a href=\"https://dev.azure.com/sjultra/web/wi.aspx?pcguid=29bee7ee-1988-4f75-b70c-ea76680ea922&amp;id=532\">Issue #532</a> (Webhook new update added4) assigned to Oluwakemi Dada by David Adeyemi",
//     "markdown":"[Issue #532](https://dev.azure.com/sjultra/web/wi.aspx?pcguid=29bee7ee-1988-4f75-b70c-ea76680ea922&id=532) (Webhook new update added4) assigned to Oluwakemi Dada by David Adeyemi"},
//     "detailedMessage":{"text":"Issue #532 (Webhook new update added4) assigned to Oluwakemi Dada by David Adeyemi\r\n(https://dev.azure.com/sjultra/web/wi.aspx?pcguid=29bee7ee-1988-4f75-b70c-ea76680ea922&id=532)\r\n\r\n- New Assigned to: Oluwakemi Dada <kemi@sjultra.com>\r\n",
//     "html":"<a href=\"https://dev.azure.com/sjultra/web/wi.aspx?pcguid=29bee7ee-1988-4f75-b70c-ea76680ea922&amp;id=532\">Issue #532</a> (Webhook new update added4) assigned to Oluwakemi Dada by David Adeyemi<ul>\r\n<li>New Assigned to: Oluwakemi Dada <kemi@sjultra.com></li></ul>",
//     "markdown":"[Issue #532](https://dev.azure.com/sjultra/web/wi.aspx?pcguid=29bee7ee-1988-4f75-b70c-ea76680ea922&id=532) (Webhook new update added4) assigned to Oluwakemi Dada by David Adeyemi\r\n\r\n* New Assigned to: Oluwakemi Dada <kemi@sjultra.com>\r\n"},
//     "resource":{"id":11,"workItemId":532,"rev":11,"revisedBy":{"id":"7d18bb29-5a26-6ed4-9f40-6be39fcdccc6","name":"David Adeyemi <dayvvo@sjultra.com>","displayName":"David Adeyemi","url":"https://spsprodweu1.vssps.visualstudio.com/A906dc49f-239c-4c64-b6fa-ed61b0b01e37/_apis/Identities/7d18bb29-5a26-6ed4-9f40-6be39fcdccc6",
//     "_links":{"avatar":{"href":"https://dev.azure.com/sjultra/_apis/GraphProfile/MemberAvatars/aad.N2QxOGJiMjktNWEyNi03ZWQ0LTlmNDAtNmJlMzlmY2RjY2M2"}},"uniqueName":"dayvvo@sjultra.com","imageUrl":"https://dev.azure.com/sjultra/_apis/GraphProfile/MemberAvatars/aad.N2QxOGJiMjktNWEyNi03ZWQ0LTlmNDAtNmJlMzlmY2RjY2M2",
//     "descriptor":"aad.N2QxOGJiMjktNWEyNi03ZWQ0LTlmNDAtNmJlMzlmY2RjY2M2"},"revisedDate":"9999-01-01T00:00:00Z","fields":{"System.Rev":{"oldValue":10,"newValue":11},"System.AuthorizedDate":{"oldValue":"2023-03-10T19:46:10.543Z","newValue":"2023-03-10T19:51:27.58Z"},"System.RevisedDate":{"oldValue":"2023-03-10T19:51:27.58Z","newValue":"9999-01-01T00:00:00Z"},"System.AssignedTo":{"oldValue":"David Adeyemi <dayvvo@sjultra.com>","newValue":"Oluwakemi Dada <kemi@sjultra.com>"},"System.ChangedDate":{"oldValue":"2023-03-10T19:46:10.543Z","newValue":"2023-03-10T19:51:27.58Z"},"System.Watermark":{"oldValue":3027,"newValue":3028}},"_links":{"self":{"href":"https://dev.azure.com/sjultra/21efcfe9-d234-49c2-9796-cf9a1f709400/_apis/wit/workItems/532/updates/11"},"workItemUpdates":{"href":"https://dev.azure.com/sjultra/21efcfe9-d234-49c2-9796-cf9a1f709400/_apis/wit/workItems/532/updates"},"parent":{"href":"https://dev.azure.com/sjultra/21efcfe9-d234-49c2-9796-cf9a1f709400/_apis/wit/workItems/532"},"html":{"href":"https://dev.azure.com/sjultra/web/wi.aspx?pcguid=29bee7ee-1988-4f75-b70c-ea76680ea922&id=532"}},"url":"https://dev.azure.com/sjultra/21efcfe9-d234-49c2-9796-cf9a1f709400/_apis/wit/workItems/532/updates/11","revision":{"id":532,"rev":11,"fields":{"System.AreaPath":"VzxyTools","System.TeamProject":"VzxyTools","System.IterationPath":"VzxyTools","System.WorkItemType":"Issue","System.State":"To Do","System.Reason":"Moved to backlog","System.AssignedTo":"Oluwakemi Dada <kemi@sjultra.com>","System.CreatedDate":"2023-03-10T19:06:32.107Z","System.CreatedBy":"David Adeyemi <dayvvo@sjultra.com>","System.ChangedDate":"2023-03-10T19:51:27.58Z","System.ChangedBy":"David Adeyemi <dayvvo@sjultra.com>","System.CommentCount":1,"System.Title":"Webhook new update added4","System.BoardColumn":"To Do","System.BoardColumnDone":false,"Microsoft.VSTS.Common.StateChangeDate":"2023-03-10T19:46:10.543Z","Microsoft.VSTS.Common.Priority":2,"WEF_EC7BC9E602484EC6AA2E17B4CF96A313_Kanban.Column":"To Do","WEF_EC7BC9E602484EC6AA2E17B4CF96A313_Kanban.Column.Done":false,"System.Description":"<div>Description number 1 new update </div>"},"_links":{"self":{"href":"https://dev.azure.com/sjultra/21efcfe9-d234-49c2-9796-cf9a1f709400/_apis/wit/workItems/532/revisions/11"},"workItemRevisions":{"href":"https://dev.azure.com/sjultra/21efcfe9-d234-49c2-9796-cf9a1f709400/_apis/wit/workItems/532/revisions"},"parent":{"href":"https://dev.azure.com/sjultra/21efcfe9-d234-49c2-9796-cf9a1f709400/_apis/wit/workItems/532"}},"url":"https://dev.azure.com/sjultra/21efcfe9-d234-49c2-9796-cf9a1f709400/_apis/wit/workItems/532/revisions/11"}},"resourceVersion":"1.0","resourceContainers":{"collection":{"id":"29bee7ee-1988-4f75-b70c-ea76680ea922","baseUrl":"https://dev.azure.com/sjultra/"},"account":{"id":"906dc49f-239c-4c64-b6fa-ed61b0b01e37","baseUrl":"https://dev.azure.com/sjultra/"},"project":{"id":"21efcfe9-d234-49c2-9796-cf9a1f709400","baseUrl":"https://dev.azure.com/sjultra/"}},"createdDate":"2023-03-10T19:51:39.0835006Z"
// }