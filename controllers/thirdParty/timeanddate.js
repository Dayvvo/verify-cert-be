const axios = require('axios').default;

const timeandDateBaseUrl = 'http://api.xmltime.com/places';

const getUserTimeZone = async ()=>{

    try{
        
        let req = await axios.get(
            timeandDateBaseUrl+`?version=3&pettyprint=1&`+
            `accesskey=${process.env['DATE-AND-TIME-ACCESS-KEY']}`+
            `&secretkey=${process.env['DATE-AND-TIME-SECRET-KEY']}`+
            `&geo=1`
        );

        const {data} = req;

        console.log('time and date data',JSON.stringify(data));

    }
    catch(err){
        console.log('error Caught',err.response)
    }

}


module.exports = {
    getUserTimeZone
}
