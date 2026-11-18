// Everything about the card that a person might want to change. card.js builds the page from this.
// Edit here, refresh, done. (Malay only for now.)
window.CARD = {
  kicker: "Walimatul Urus",
  bride: "Putri",
  groom: "Afiq",

  weekday: "Ahad",
  day: "15",
  monthYear: "Ogos 2027",
  hijri: "13 Rabiulawal 1449H",
  time: "12.00 tengah hari – 4.00 petang",
  // Real moment of the event (Malaysia time). Drives the countdown and both calendar buttons.
  start: "2027-08-15T12:00:00+08:00",
  end: "2027-08-15T16:00:00+08:00",

  venue: "The Glass Galore",
  area: "Cyberjaya",
  mapsQuery: "The Glass Galore, Cyberjaya",

  dressCode: ["#1E7A54"],

  salamKaut: { bank: "Maybank", account: "2569055663", holder: "putri" },
  contact: { name: "Putra", phone: "+60123214253" },

  maxPax: 10, // keep equal to MAX_PAX in .env (the server enforces its own limit)

  // The card's theme song. Plays when the guest taps Buka; the speaker button toggles it.
  // public/audio/theme1.mp3 is the alternate track (swap the path to use it).
  song: "/audio/theme.mp3",
  // Optional. Put a real flower-wreath image (transparent WebP/PNG, ~1040x1360) at this path to use it
  // instead of the drawn SVG flowers.
  wreathImage: "/img/wreath.webp",
};
