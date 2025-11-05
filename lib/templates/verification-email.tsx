function getGreeting(): string {
  const hour = new Date().getHours();
  return hour >= 18 ? "Bonsoir" : "Bonjour";
}

export function getVerificationEmailTemplate(
  name: string,
  verificationUrl: string
) {
  const greeting = getGreeting();
  
  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">CarRental</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">${greeting} ${name},</h2>
            <p>Merci de vous être inscrit sur CarRental !</p>
            <p>Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Vérifier mon email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Ou copiez-collez ce lien dans votre navigateur :</p>
            <p style="color: #667eea; word-break: break-all; font-size: 12px;">${verificationUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Ce lien expirera dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} CarRental. Tous droits réservés.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      ${greeting} ${name},
      
      Merci de vous être inscrit sur CarRental !
      
      Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur ce lien :
      ${verificationUrl}
      
      Ce lien expirera dans 24 heures.
      
      Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
      
      © ${new Date().getFullYear()} CarRental. Tous droits réservés.
    `,
  };
}

