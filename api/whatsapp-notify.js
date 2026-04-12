const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

// These would be set in Vercel environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. whatsapp:+14155238886 (sandbox number)
const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER; // e.g. whatsapp:+91xxxxxxxxxx

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS for bot

const client = twilio(accountSid, authToken);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = async (req, res) => {
  // Simple check to see if triggered correctly
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('full_name, phone, expiry_date');

    if (error) throw error;

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const expiringToday = members.filter(m => m.expiry_date === todayStr);
    const expiringSoon = members.filter(m => m.expiry_date > todayStr && m.expiry_date <= sevenDaysStr);
    const expired = members.filter(m => m.expiry_date < todayStr);

    let messageBody = `*Good morning! Bajrang Gym Daily Report*\n\n`;

    if (expiringToday.length > 0) {
      messageBody += `*Expiring Today:*\n`;
      expiringToday.forEach((m, i) => messageBody += `${i+1}. ${m.full_name} (${m.phone})\n`);
    } else {
      messageBody += `*No memberships expiring today.*\n`;
    }

    if (expiringSoon.length > 0) {
      messageBody += `\n*Expiring this week:*\n`;
      expiringSoon.forEach((m, i) => messageBody += `${i+1}. ${m.full_name} - ${m.expiry_date}\n`);
    }

    messageBody += `\nPlease follow up with them today. Have a great day!`;

    await client.messages.create({
      from: twilioNumber,
      to: ownerNumber,
      body: messageBody
    });

    res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
