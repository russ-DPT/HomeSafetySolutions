/* Home Safety Solutions: site configuration

   BOOKING: all PracticeQ booking, form, and portal links live in
   lib/booking-links.mjs. They are written into the pages at build time.

   STRIPE: paste Payment Link URLs (Stripe Dashboard > Payment Links),
   for example "https://buy.stripe.com/abc123". Leave a value as "" until
   it is ready; a blank link falls back to calling us. */

window.HSS_CONFIG = {
  phoneDisplay: "(813) 365-9171",
  phoneHref: "tel:+18133659171",
  email: "info@homesafety.solutions",

  stripe: {
    membershipAnnual:  "",  // $600 per year
    membershipMonthly: "",  // $55 per month
    contractorConsult: "",  // $150
    deepDive:          "",  // $75 Storm Ready or Assistive Technology deep dive
    remoteCaregivingPlan: "",  // $150 Remote Caregiving Plan deep dive
    facilityCase:      "",  // $150 per case
    facilityPack:      "",  // $1,400 ten-case pack
    giftCertificate:   "",  // customer chooses amount
    customerPortal:    ""   // Stripe customer portal login link for members
  },

  /* GOOGLE MAPS: paste the embed URL of your Google My Maps service-area map
     (My Maps > Share > Embed on my site > copy only the src="..." address).
     Leave blank to show the standard Google Map centered on Apollo Beach. */
  serviceAreaMap: "https://www.google.com/maps/d/embed?mid=1eoxElL87MX7xGun_tQIjHh8NVc71AdE"
};
