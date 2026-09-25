// The ONLY place PracticeQ URLs live. Change a URL here, then run
// `node scripts/sync-booking-links.mjs` (it also runs automatically on every
// build). Every HTML element with data-link="KEY" gets its href rewritten.
// All links were opened and verified on September 25, 2026, except CLIENT_PORTAL.

const Q = "https://intakeq.com/booking/zm1cyz?serviceId="

export const LINKS = {
  BOOKING_HOME: "https://intakeq.com/booking/zm1cyz",

  // Public services
  CONSULT: Q + "7c400002-9dcd-4689-a8e5-1e075c4c5d9c",
  HSV_TELE: Q + "fc7905b8-7f42-433d-a7e1-89664652a294",
  HSV_HOME: Q + "a872ba9a-7c6a-4f38-a6c6-0f5b709171e7",
  RFD_TELE: Q + "bf512aae-ae1d-4b68-ab20-0ced1599b447",
  RFD_HOME: Q + "a9dc88d5-81c5-4ac3-9d7a-f22429b773a2",
  CHS_HOME: Q + "fbb11d8a-dc63-439f-9ee0-9f40ca039d9e",
  AT_TELE: Q + "91d15d41-8a18-4cc2-ae78-a7d931e7881d",
  AT_HOME: Q + "a49fb6e3-9a15-4e81-8a40-1a214c720320",
  RCP_TELE: Q + "af1bec3a-6b59-4fd1-b478-00f92c49c924",
  RCP_HOME: Q + "a539ac1d-134d-4f55-910b-4cc008e3b3ce",
  STORM_HOME: Q + "b32a0339-12a5-43af-913b-7570760c7148",
  RIGHT_HOME: Q + "b7852a6a-2ec1-4867-ad8e-e44c7b2ca7e2",
  BUILD_VERIFY: Q + "501cb5e2-db6b-4082-b6e2-bbb9725f7488",
  CONTRACTOR: Q + "6a0fba55-2613-4b5f-a8a1-c759b0fcbfa7",
  RCP_REVIEW: Q + "5ec07be1-579d-4063-9fc0-f7ffdff6348b",
  PARTNER_CALL: Q + "6346886c-0bc6-4995-ae1c-6d30f1346129",
  FACILITY_CALL: Q + "3f099695-d828-4dbe-ae79-709a9dac616e",
  MEMBERSHIP_ANNUAL: "https://intakeq.com/booking/zm1cyz?packageId=4d864f09-a671-4909-9be0-1c8509c8f92d",

  // Consultation Credit services: $50 less, hidden in PracticeQ.
  // Used ONLY on the unlisted /consultation-credit page.
  HSV_TELE_CREDIT: Q + "14888bc6-3b72-4d60-8ed4-e7411b71ed6f",
  HSV_HOME_CREDIT: Q + "e504eea4-6d90-40ed-94f5-73e0896bf3ca",
  RFD_TELE_CREDIT: Q + "f507c800-bfce-4241-b7bb-afae7ac30539",
  RFD_HOME_CREDIT: Q + "2236e13f-3a18-4496-884e-d4150121bcb3",
  CHS_HOME_CREDIT: Q + "1ed0e1eb-4eff-4873-8b42-51df586aff22",
  AT_TELE_CREDIT: Q + "47f5b8f6-673a-4470-8844-9ecac4aef97a",
  AT_HOME_CREDIT: Q + "2a388644-b0f2-44a8-8b2a-bf32f80a99b3",
  RCP_TELE_CREDIT: Q + "8458ff50-94bc-47fd-81d5-b38c0f1e3a06",
  RCP_HOME_CREDIT: Q + "f2e2fb6a-8410-46eb-812d-2b6a99cc33a5",
  STORM_HOME_CREDIT: Q + "9f6adeae-7333-4b61-9e7a-459b16803563",
  RIGHT_HOME_CREDIT: Q + "e3af2f2b-b64a-46e2-bbfa-ffdeaa3116fa",

  // Public forms and portal
  RELEASE_FORM: "https://intakeq.com/c/93JlSC",
  CONTRACTOR_FORM: "https://intakeq.com/c/U8q1rr",
  PARTNER_FORM: "https://intakeq.com/new/so3oe5",
  CLIENT_PORTAL: "https://zm1cyz.intakeq.com/booking?clientArea=1", // not yet verified
}

// Services that go through /before-you-book?service=<key>.
// `urgent` shows the "Is discharge in the next few days?" callout.
export const BEFORE_YOU_BOOK = {
  "home-safety-visit": { name: "Home Safety Visit", options: [["By video, $175", "HSV_TELE"], ["In your home, $250", "HSV_HOME"]] },
  "ready-for-discharge": { name: "Ready for Discharge", urgent: true, options: [["By video, $175", "RFD_TELE"], ["In your home, $250", "RFD_HOME"]] },
  "coming-home-safe": { name: "Coming Home Safe", urgent: true, options: [["In your home, $350", "CHS_HOME"]] },
  "assistive-technology": { name: "Assistive Technology Consultation", options: [["By video, $175", "AT_TELE"], ["In your home, $250", "AT_HOME"]] },
  "remote-caregiving": { name: "Remote Caregiving Plan", options: [["By video, $175", "RCP_TELE"], ["In your home, $250", "RCP_HOME"]] },
  "storm-ready": { name: "Storm Ready Audit", options: [["In your home, $250", "STORM_HOME"]] },
  "right-home": { name: "Right Home Assessment", options: [["In your home, $250", "RIGHT_HOME"]] },
}
