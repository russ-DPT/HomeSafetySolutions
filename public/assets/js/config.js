/* Home Safety Solutions: site configuration

   BOOKING: all PracticeQ booking, form, and portal links live in
   lib/booking-links.mjs. They are written into the pages at build time.

   STRIPE: paste Payment Link URLs (Stripe Dashboard > Payment Links),
   for example "https://buy.stripe.com/abc123". Leave a value as "" until
   it is ready; a blank link falls back to calling us. */

window.HSS_CONFIG = {
  phoneDisplay: "(813) 867-3372",
  phoneHref: "tel:+18138673372",
  email: "info@homesafety.solutions",

  stripe: {
    membershipAnnual:  "",  // $600 per year
    membershipMonthly: "",  // $55 per month
    contractorConsult: "",  // $150
    travelZone2:       "",  // $25
    travelZone3:       "",  // $50
    stormAddOn:        "",  // from $100 Storm Ready Audit added to a visit, same trip ($100 first add-on, $50 second)
    facilityCase:      "",  // $150 per case
    facilityPack:      "",  // $1,400 ten-case pack
    giftCertificate:   "",  // customer chooses amount
    customerPortal:    ""   // Stripe customer portal login link for members
  },

  /* GOOGLE MAPS: paste the embed URL of your Google My Maps service-area map
     (My Maps > Share > Embed on my site > copy only the src="..." address).
     Leave blank to show the standard Google Map centered on Apollo Beach. */
  serviceAreaMap: ""
};
