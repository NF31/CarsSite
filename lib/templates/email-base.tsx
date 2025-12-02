/**
 * Template de base pour les emails HTML
 */
export function renderEmailBase(params: {
  title: string;
  bodyContent: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${params.title}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f3f4f6;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6; padding:32px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 24px 60px -30px rgba(2,132,199,0.25); font-family:'Geist Sans', Arial, sans-serif;">
                ${params.bodyContent}
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; margin-top:16px; font-family:'Geist Sans', Arial, sans-serif;">
                <tr>
                  <td align="center" style="font-size:12px; color:#94a3b8;">
                    © ${new Date().getFullYear()} CarRental • 102 Avenue de la Mobilité, 75000 Paris
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

