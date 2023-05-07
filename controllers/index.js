

const { create }= require('ipfs-http-client');
const DocSchema = require('../models/index'); 

const INFURA_ID="2LdUH650LWhrTY6EmtJ0OJoFxZq";
const INFURA_SECRET_KEY="99843d60012b219bc56154d7e705df41"
const authorization = 'Basic ' + Buffer.from(INFURA_ID + ':' + INFURA_SECRET_KEY).toString('base64'); 

const ipfsClient = async ()=> await create({
        host:'ipfs.infura.io',
        port:5001,
        protocol:'https',
        headers:{
            authorization
        }
    })

const uploadUserCert = async(req,res)=>{
    try{        

        const dataClient  = await ipfsClient();

        let data= await dataClient.add(JSON.stringify(req.body));



        const userData = await new DocSchema({
            hash:data.cid.toString()
        }).save()

        console.log('user hash and data', userData);


        return res.json(userData);



    }
    catch(err){
        console.log('error caught',err);
    }
}

async function getUserData(req,res) {
    try{
        let hash = req.query['hash'];

        let ipfs = await ipfsClient();    

        let asyncitr = ipfs.cat(hash)
        let data;

        for await (const itr of asyncitr) {
            data = Buffer.from(itr).toString();
        }

        res.json({
            status:'success',
            data
        });
    }
    catch(err){
        console.log('error',err)
        return res.json({
            status:'failed',
        })
    }


}



module.exports = {
    uploadUserCert,
    getUserData
}