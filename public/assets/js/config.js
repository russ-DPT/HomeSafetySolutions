/* Home Safety Solutions: site configuration
   This is the ONLY file you need to edit to connect booking and payments.
   Leave a value as "" until it is ready. Any button whose link is blank
   automatically falls back to "Call to book" so nothing on the site breaks.

   CALENDLY: paste the PUBLIC link for each event type
   (Calendly > Scheduling > event type > Copy link), for example
   "https://calendly.com/your-handle/initial-consultation".
   The dashboard address (calendly.com/app/...) will not work here.

   STRIPE: paste Payment Link URLs (Stripe Dashboard > Payment Links),
   for example "https://buy.stripe.com/abc123". */

window.HSS_CONFIG = {
  phoneDisplay: "(813) 867-3372",
  phoneHref: "tel:+18138673372",
  email: "info@homesafety.solutions",

  /* Until each service has its own Calendly event, every service button sends people
     to the $50 Initial Consultation below, with a note that the $50 is credited toward
     any visit booked within 30 days. Card payments are taken by phone for now. */
  calendly: {
    consultation:     "https://calendly.com/docrusspt/dr-russ-l-hommedieu-30-minute-phone-meeting",  // $50 Initial Consultation, 30 min, phone
    visit:            "",  // Home Safety Visit, $250 (consultation credit applied as a Calendly coupon)
    rfdVirtual:       "",  // Ready for Discharge: Virtual, $175
    rfdRush:          "",  // Ready for Discharge: Virtual, Rush within 24 hours, $225
    rfdInHome:        "",  // Ready for Discharge: In-Home, $300
    storm:            "",  // Storm Ready Audit, $175
    rightHome:        "",  // Right Home Assessment, $275
    buildVerify:      "",  // Build Verify Visit, $100
    contractorCall:   "",  // Contractor follow-up call (booked after the Contractor Consultation is paid)
    partnerIntro:     "",  // Free 20 minute call for physicians, therapists, and discharge planners
    facilityIntro:    ""   // Free 30 minute call for facilities
  },

  stripe: {
    membershipAnnual:  "",  // $600 per year
    membershipMonthly: "",  // $55 per month
    contractorConsult: "",  // $150
    travelZone2:       "",  // $25
    travelZone3:       "",  // $50
    stormAddOn:        "",  // $125 Storm Ready combined with another visit ($175 less $50 discount)
    facilityCase:      "",  // $150 per case
    facilityPack:      "",  // $1,400 ten-case pack
    giftCertificate:   "",  // customer chooses amount
    customerPortal:    ""   // Stripe customer portal login link for members
  },

  /* GOOGLE MAPS: paste the embed URL of your Google My Maps service-area map
     (My Maps > Share > Embed on my site > copy only the src="..." address).
     Leave blank to show the standard Google Map centered on Apollo Beach. */
  serviceAreaMap: "",

  calendlyTheme: { primary: "0B3D62", text: "13293D", background: "ffffff" }
};
