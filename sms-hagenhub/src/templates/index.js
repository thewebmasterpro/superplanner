/**
 * SMS Templates for common use cases
 */
export const templates = {
  welcome: (name) =>
    `Willkommen bei HagenHub, ${name}! Wir freuen uns, Sie an Bord zu haben.`,

  appointmentReminder: (name, date, time) =>
    `Hallo ${name}, Erinnerung an Ihren Termin am ${date} um ${time}. Antworten Sie mit JA zur Bestätigung.`,

  orderConfirmation: (orderNumber) =>
    `Ihre Bestellung #${orderNumber} wurde bestätigt. Vielen Dank für Ihren Einkauf!`,

  verificationCode: (code) =>
    `Ihr Verifizierungscode lautet: ${code}. Gültig für 10 Minuten.`,

  promotionalOffer: (offer) =>
    `HagenHub Sonderangebot: ${offer}. Antworten Sie mit STOP zum Abbestellen.`,
};
