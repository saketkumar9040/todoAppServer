const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
import  twilio  from 'twilio';

 export const sendOTP = async(phone, message) => {
  const client = twilio(accountSid, authToken);
  await client.messages
    .create({
       body: message,
       from: process.env.TWILIO_PHONE_NUMBER,
       to: phone
     })
    .then(message => console.log(`SENT SMS ID IS :${message.sid}`))
    .catch(error => console.log(error.message))
}