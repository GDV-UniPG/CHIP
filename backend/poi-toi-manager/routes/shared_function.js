import nodemailer from "nodemailer";

export async function sendEmail({ from, to, subject, html }) {
    return new Promise((resolve, reject) => {
      let mailOptions = {
        from,
        to,
        subject,
        html,
      };
  
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PWDEMAIL,
        },
        tls: {
          rejectUnauthorized: false,  
        }
      });
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log("errore:"+ err.message)
          console.log(err.message);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  

  export function getVerifyLinkEmailMessage(name, token, language) {
    if (language == "it")
      return (
        "Ciao  " +
        name +
        ", <br> Verifica la tua email cliccando sul seguente link: <br>"+ process.env.VerificationEmailLink +
        token +
        " "
      );
    else
      return (
        "Hello  " +
        name +
        ", <br> Please verify your email by clicking this link: <br>"+ process.env.VerificationEmailLink +
        token +
        " "
      );
  }

 export function getResetPasswordMessage(name, token, language) {
    if (language == "it")
      return (
        "Ciao, " +
        name +
        " <br> usa questo link per creare una nuova password: <br>"+ process.env.ResetPasswordLink +
        token +
        "<br> Il link scadrà fra 1 ora. "
      );
    else
      return (
        "Hello, " +
        name +
        "<br> use this link to create a new password: <br>"+ process.env.ResetPasswordLink +
        token +
        "<br> The link will expire in 1 hour. "
      );
  }