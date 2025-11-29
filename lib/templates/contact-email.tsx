import { getGreeting } from "@/lib/email/utils/greeting";

interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Template email de confirmation pour l'utilisateur qui a envoyé une demande de contact
 */
export function getContactConfirmationEmailTemplate(data: ContactEmailData, greeting?: string) {
  const finalGreeting = greeting ?? getGreeting();
  
  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">CarRental</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; font-size: 24px;">${finalGreeting} ${data.name},</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              Merci de nous avoir contactés ! Nous avons bien reçu votre message concernant : <strong>${data.subject}</strong>
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 30px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong style="color: #333;">Votre message :</strong><br>
                "${data.message.substring(0, 200)}${data.message.length > 200 ? '...' : ''}"
              </p>
            </div>
            
            <p style="color: #666; font-size: 16px; margin-top: 30px;">
              Notre équipe va examiner votre demande et vous répondre dans les plus brefs délais, généralement sous 24 heures ouvrées.
            </p>
            
            <p style="color: #666; font-size: 16px; margin-top: 20px;">
              Si votre demande est urgente, n'hésitez pas à nous appeler directement au <a href="tel:+33123456789" style="color: #667eea; text-decoration: none; font-weight: bold;">+33 1 23 45 67 89</a> (Lun-Ven, 9h-18h).
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/vehicles" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Découvrir nos véhicules
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.<br>
              Pour toute question, contactez-nous via notre <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/contact" style="color: #667eea;">page de contact</a>.
            </p>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              © ${new Date().getFullYear()} CarRental. Tous droits réservés.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      ${finalGreeting} ${data.name},

      Merci de nous avoir contactés ! Nous avons bien reçu votre message concernant : ${data.subject}

      Votre message :
      "${data.message}"

      Notre équipe va examiner votre demande et vous répondre dans les plus brefs délais, généralement sous 24 heures ouvrées.

      Si votre demande est urgente, n'hésitez pas à nous appeler directement au +33 1 23 45 67 89 (Lun-Ven, 9h-18h).

      Découvrir nos véhicules : ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/vehicles

      Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
      Pour toute question, contactez-nous via notre page de contact : ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/contact

      © ${new Date().getFullYear()} CarRental. Tous droits réservés.
    `,
  };
}

/**
 * Template email de notification pour l'admin lorsqu'une nouvelle demande de contact arrive
 */
export function getContactNotificationEmailTemplate(data: ContactEmailData, greeting?: string) {
  const finalGreeting = greeting ?? getGreeting();
  
  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Nouvelle demande de contact</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              ${finalGreeting},<br>
              Une nouvelle demande de contact a été reçue via le formulaire de contact de CarRental.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Informations du contact</h3>
              <p style="margin: 8px 0; color: #666; font-size: 14px;">
                <strong style="color: #333;">Nom :</strong> ${data.name}
              </p>
              <p style="margin: 8px 0; color: #666; font-size: 14px;">
                <strong style="color: #333;">Email :</strong> <a href="mailto:${data.email}" style="color: #667eea; text-decoration: none;">${data.email}</a>
              </p>
              ${data.phone ? `
              <p style="margin: 8px 0; color: #666; font-size: 14px;">
                <strong style="color: #333;">Téléphone :</strong> <a href="tel:${data.phone.replace(/\s/g, '')}" style="color: #667eea; text-decoration: none;">${data.phone}</a>
              </p>
              ` : ''}
              <p style="margin: 8px 0; color: #666; font-size: 14px;">
                <strong style="color: #333;">Sujet :</strong> ${data.subject}
              </p>
            </div>
            
            <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Message</h3>
              <p style="margin: 0; color: #666; font-size: 14px; white-space: pre-wrap;">${data.message}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Répondre à ${data.name}
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Reçu le ${new Date().toLocaleDateString("fr-FR", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })} via le formulaire de contact de CarRental.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      ${finalGreeting},

      Une nouvelle demande de contact a été reçue via le formulaire de contact de CarRental.

      Informations du contact :
      - Nom : ${data.name}
      - Email : ${data.email}
      ${data.phone ? `- Téléphone : ${data.phone}` : ''}
      - Sujet : ${data.subject}

      Message :
      ${data.message}

      Répondre : mailto:${data.email}?subject=Re: ${data.subject}

      Reçu le ${new Date().toLocaleDateString("fr-FR", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })} via le formulaire de contact de CarRental.
    `,
  };
}

