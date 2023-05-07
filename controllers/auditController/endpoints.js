const { backendURL } = require('../../utils/setEnvs');

const axios = require('axios').default



// controller util



const LogToSplunk = async(payload)=>{
    try{        
        
        console.log('protocol',backendURL);

        let auditpayload = {
            "host":backendURL,
            "index": "peepsdb-http-index",
            "sourcetype":"web",
            "source":"peepsdb",
            "event":[payload]
        };

        const req = await axios.post(process.env['SPLUNK_INSTANCE']+'services/collector',JSON.stringify(auditpayload),{
            headers:{
                'Authorization':`Splunk ${process.env['SPLUNK_TOKEN']}`
            }
        });

        const {data} = req;

        // console.log('successful response at',payload?.type,data);

    }
    catch(err){
        console.log('err at log to splunk',err?.response?.data || err);
    }
}


module.exports = {
    LogToSplunk
}