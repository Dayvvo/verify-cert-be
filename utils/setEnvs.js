const githubClientID = process.env['NODE_ENV']==='production'? process.env['GITHUB_CLIENT_ID']:process.env['GITHUB_TEST_CLIENT_ID']

const githubClientSecret= process.env[`GITHUB_${process.env.NODE_ENV==='production'?'':'TEST_'}CLIENT_SECRET`];

const frontendURL = process.env[`FRONTEND_URL`];

const backendURL = process.env[`BACKEND_URL`];

const getFrontEndURL = (hostUrl)=>backendURL?.includes(hostUrl) ? process.env[`FRONTEND_URL`] : process.env['FRONTEND_LOCAL_URL'];

const jiraPAT = Buffer.from(`dayvvo@sjultra.com:${process.env.JIRA_PAT}`).toString('base64');


const envObject = {
  frontendURL: frontendURL,
  b2cDomain: process.env['B2C_DOMAIN'],
  authReadScopes:process.env['AUTHREAD_SCOPES']?.split(' '),
  authWriteScopes:process.env['AUTHWRITE_SCOPES']?.split(' '),
  susiPolicy:process.env['B2C_SUSI'],
  clientID: process.env['B2C_CLIENT_ID']
}

module.exports = {
    githubClientID,
    githubClientSecret,
    frontendURL,
    backendURL,
    jiraPAT,
    getFrontEndURL,
    envObject
};
  