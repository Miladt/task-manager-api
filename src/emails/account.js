const sgMail=require('@sendgrid/mail')

const sendgridAPIKey=process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendgridAPIKey)

const sendWelcomeEmail=(email,name)=>{
    sgMail.send({
        to:email,
        from:'Milad@gmail.com',
        subject:'Thanks for joining  in!',
        text:`Welcome to the App, Dear ${name}`
    })
}
module.exports={
    sendWelcomeEmail
}