const sgMail = require('@sendgrid/mail') //npm package for sending mails using df method to access the send grid Service

//const sendgridAPIKey = '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'  //API key

sgMail.setApiKey(process.env.SENDGRID_API_KEY)  // Setup of API key

const sendWelcomeEmail = (email, name) => {  // sending welcome email to new user
    sgMail.send({
        to: email,
        from: 'mdwahidali122@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. let me know how you get along with the app.`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mdwahidali122@gmail.com',
        subject: 'Sorry to see u go!',
        text: `Hi ${name}, Please let us know why u discontinued with us!`
        //text: `Goodbye, ${name}. I hope to see u nack sometimes soon `
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}
