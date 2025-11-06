function getGreeting(): string {
  const hour = new Date().getHours();
  return hour >= 18 ? "Bonsoir" : "Bonjour";
}

export function getAccountDeletionEmailTemplate(
  name: string,
  confirmationUrl: string
) {
  const greeting = getGreeting();
  
  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🚗 CarRental</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">${greeting} ${name},</h2>
            <p>Vous avez demandé la suppression de votre compte CarRental.</p>
            <p style="color: #dc2626; font-weight: bold;">Cette action est <strong>irréversible</strong> et entraînera la suppression définitive de :</p>
            <ul style="margin: 20px 0; padding-left: 20px;">
              <li>Vos informations personnelles</li>
              <li>Toutes vos réservations</li>
              <li>Vos avis et commentaires</li>
              <li>Vos factures et historique</li>
            </ul>
            <p>Si vous souhaitez vraiment supprimer votre compte, cliquez sur le bouton ci-dessous dans les <strong>24 prochaines heures</strong> :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Confirmer la suppression
              </a>
            </div>
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #dc2626; margin: 0; font-weight: bold;">⚠️ Si vous n'avez pas demandé cette suppression, ignorez cet email. Votre compte restera actif.</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Ce lien expirera dans 24 heures pour votre sécurité.
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Ou copiez-collez ce lien dans votre navigateur :<br>
              <span style="color: #dc2626; word-break: break-all; font-size: 12px;">${confirmationUrl}</span>
            </p>
          </div>
        </body>
      </html>
    `,
  };
}
