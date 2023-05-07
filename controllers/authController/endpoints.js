const { githubClientID,githubClientSecret, backendURL } = require('../../utils/setEnvs');
const axios = require('axios').default;
const { URLSearchParams } = require('url');

const getGithubUser = async (accessToken)=>{
    
    try{
        const req =  await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${accessToken}` },
        })        
        console.log('github user data',req.data)
        return req.data;

    }
    catch(err){
        console.log('err at fetching github user',err)

        return('error!')
    }

}


async function getGithubAuthToken({ code }) {
 
    try{
        console.log('github secrets',
            githubClientID,githubClientSecret
        )

        const githubToken = await axios.post(
            `https://github.com/login/oauth/access_token?client_id=${githubClientID}&client_secret=${githubClientSecret}&code=${code}`
        )
        let {data,status} = githubToken;


        if (data.includes('access_token')){
            let queryData  = data.split('&scope')[0].split('=')

            // console.log('split query',queryData);

            let getUser = await getGithubUser(queryData[1])


            return getUser



        }



        getGithubUser(accessToken)  
    }
    catch(error){
        console.log('Err at getting git token',error?.response?.data?.json)

    }
}


const getLinkedInUser = async (accessToken)=>{
    try{
        let me = await axios.get('https://api.linkedin.com/v2/me',{
            headers:{
                Authorization:`Bearer ${accessToken}`
            }
        })

        const {data} = me;

        // console.log('my profile',data)
        return data;
    }
    catch(error){
        console.log('err at fetching me',error)
    }
}

const getLinkedInToken = async(code)=>{

    try{
        const linkedInAccessToken =await axios.post('https://www.linkedin.com/oauth/v2/accessToken',new URLSearchParams({
            grant_type:'authorization_code',
            code,
            client_id:process.env['LINKEDIN_CLIENT'],
            client_secret:process.env['LINKEDIN_SECRET'],
            redirect_uri:`${backendURL}${process.env.LINKEDIN_CALLBACK_URL}`
        }),{
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'            
            }
        });

        const {data} = linkedInAccessToken;

        console.log('linkedinAccessToken',data);

        const linkedinUser = getLinkedInUser(data?.access_token);
        
        return linkedinUser
         
    }
    catch(error){
        console.log('err at fetching linkedin Access token',error?.response?.data)
        return {
            error
        }
    }
}



const getFacebookMe = async (accessToken) => {
    try {
  
      // Get the name and user id of the Facebook user associated with the
      // access token.
      const profileFields = `&fields=${encodeURIComponent(`picture, email, first_name, last_name`)}` 
      const data = await axios.get(`https://graph.facebook.com/me?access_token=${encodeURIComponent(accessToken)}`+ profileFields ).then(res => res.data);


    //   console.log('facebook profile',data)
      return {
        data
      }
    } catch (error) {
      console.log('err at getting facebookme', error?.response? error?.response?.data: error);

      return {
        error
      }
    }
};
  


const getFacebookToken = async(code)=>{
    try{

        const accessTokenUrl = 'https://graph.facebook.com/v6.0/oauth/access_token?'+
        `client_id=${process.env['FACEBOOK_CLIENT_ID']}&`+
        `client_secret=${process.env['FACEBOOK_CLIENT_SECRET']}&`+
        `redirect_uri=${encodeURIComponent(`${process.env.BACKEND_URL}${process.env.FACEBOOK_CALLBACK_URL}`)}&` +
        `code=${encodeURIComponent(code)}`;

  
      // Make an API request to exchange `authCode` for an access token
        const accessToken = await axios.get(accessTokenUrl).then(res => res.data['access_token']);
      // Store the token in memory for now. Later we'll store it in the database.
        console.log('Access token is', accessToken);
        
        const facebookProfile = await getFacebookMe(accessToken)
        
        return facebookProfile
        
    }
    catch(err){
        console.log('err at fetching facebook token',err?.response)
    }
}


        

module.exports = {
    getGithubUser,
    getGithubAuthToken,
    getLinkedInToken,
    getFacebookToken
}