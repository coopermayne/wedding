// Google Apps Script — paste this in Extensions > Apps Script in your Google Sheet
// Update SITE_URL to your actual domain once deployed

var SITE_URL = "https://your-wedding-site.com"; // <-- CHANGE THIS

function sendInvites() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Guest List");
  var data = sheet.getDataRange().getValues();

  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var code = data[i][0];
    var name = data[i][1];
    var email = data[i][2];
    var sent = data[i][4]; // Column E — we'll mark "sent" here

    // Skip if already sent or missing data
    if (sent === "sent" || !code || !email) continue;

    var firstName = name.split(" ")[0];
    var rsvpLink = SITE_URL + "/rsvp/" + code;

    var subject = "You're Invited! Emily & Max's Wedding — October 24, 2026";

    var body = "Hey " + firstName + "!\n\n"
      + "We're getting married! And we'd love for you to be there.\n\n"
      + "October 24, 2026 · Los Angeles, California · 3:30 p.m.\n\n"
      + "All the details + your personal RSVP link:\n"
      + rsvpLink + "\n\n"
      + "We can't wait to celebrate with you.\n\n"
      + "Love,\nEmily & Max";

    var htmlBody = "<div style='font-family: Georgia, serif; font-size: 16px; max-width: 500px;'>"
      + "<p>Hey " + firstName + "!</p>"
      + "<p>We're getting married! And we'd love for you to be there.</p>"
      + "<p><strong>October 24, 2026 · Los Angeles, California · 3:30 p.m.</strong></p>"
      + "<p>All the details + your personal RSVP link:</p>"
      + "<p><a href='" + rsvpLink + "' style='color: #cc00cc; font-size: 18px; font-weight: bold;'>RSVP Here →</a></p>"
      + "<p>We can't wait to celebrate with you.</p>"
      + "<p>Love,<br>Emily & Max</p>"
      + "</div>";

    GmailApp.sendEmail(email, subject, body, {
      htmlBody: htmlBody,
      name: "Emily & Max"
    });

    // Mark as sent in column E
    sheet.getRange(i + 1, 5).setValue("sent");

    // Small delay to avoid rate limits
    Utilities.sleep(1000);
  }

  SpreadsheetApp.getUi().alert("All invites sent!");
}

// Send to just one person (for testing)
function sendTestInvite() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Guest List");
  var data = sheet.getDataRange().getValues();

  // Sends to the FIRST row only (row 2)
  var code = data[1][0];
  var name = data[1][1];
  var email = data[1][2];
  var firstName = name.split(" ")[0];
  var rsvpLink = SITE_URL + "/rsvp/" + code;

  var subject = "[TEST] You're Invited! Emily & Max's Wedding";

  var body = "Hey " + firstName + "!\n\n"
    + "We're getting married! And we'd love for you to be there.\n\n"
    + "October 24, 2026 · Los Angeles, California · 3:30 p.m.\n\n"
    + "All the details + your personal RSVP link:\n"
    + rsvpLink + "\n\n"
    + "Love,\nEmily & Max";

  var htmlBody = "<div style='font-family: Georgia, serif; font-size: 16px; max-width: 500px;'>"
    + "<p>Hey " + firstName + "!</p>"
    + "<p>We're getting married! And we'd love for you to be there.</p>"
    + "<p><strong>October 24, 2026 · Los Angeles, California · 3:30 p.m.</strong></p>"
    + "<p>All the details + your personal RSVP link:</p>"
    + "<p><a href='" + rsvpLink + "' style='color: #cc00cc; font-size: 18px; font-weight: bold;'>RSVP Here →</a></p>"
    + "<p>We can't wait to celebrate with you.</p>"
    + "<p>Love,<br>Emily & Max</p>"
    + "</div>";

  GmailApp.sendEmail(email, subject, body, {
    htmlBody: htmlBody,
    name: "Emily & Max"
  });

  SpreadsheetApp.getUi().alert("Test invite sent to " + email);
}
