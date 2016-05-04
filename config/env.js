function getEnv() {
  if(process.env.NODE_ENV) return process.env.NODE_ENV
  if(process.env.AWS_LAMBDA_FUNCTION_NAME) {
    if(process.env.AWS_LAMBDA_FUNCTION_NAME == 'arn:aws:lambda:us-east-1:651462633782:function:1800flowers-alexa') return 'production';
    else return 'staging'
  }
  return 'local';
}

module.exports = getEnv();
