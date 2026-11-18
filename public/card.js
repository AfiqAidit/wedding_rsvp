"use strict";
// Builds the invitation from window.CARD (config.js) and wires up all behaviour.
// Flow: closed cover (only oval + names + Buka) -> tap Buka -> zoom through the oval into the card.
(() => {
  const C = window.CARD;
  const root = document.getElementById("root");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------ icons ------------------------------ */
  const ICON = {
    rings: '<circle cx="39" cy="52" r="21"/><circle cx="61" cy="52" r="21"/>',
    calendar: '<rect x="14" y="22" width="72" height="64" rx="5"/><path d="M14 40H86M32 12V30M68 12V30M36 62l10 10 20-20"/>',
    hanger: '<path d="M50 32c0-8 8-10 8-16 0-5-4-8-8-8s-8 3-8 8M50 32L10 64c-4 4-2 10 4 10h72c6 0 8-6 4-10z"/>',
    pin: '<path d="M50 92S18 58 18 38C18 20 32 8 50 8s32 12 32 30c0 20-32 54-32 54z"/><circle cx="50" cy="38" r="12"/>',
    envelope: '<rect x="10" y="22" width="80" height="56" rx="5"/><path d="M12 26l38 30 38-30"/>',
    chat: '<path d="M14 18h72a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H48L28 88V70H14a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4z"/>',
    gift: '<rect x="12" y="40" width="76" height="48" rx="3"/><path d="M8 40h84V26H8zM50 26v62M50 26C40 8 22 14 30 26M50 26C60 8 78 14 70 26"/>',
    phone: '<path d="M26 12h14l8 22-10 7c5 11 13 19 24 24l7-10 22 8v14c0 6-5 11-11 11C46 88 12 54 12 24c0-6 6-12 14-12z"/>',
  };
  // pathLength="1" lets CSS "draw" every stroke in with a single dashoffset transition.
  const drawable = (s) => s.replace(/<(path|circle|rect|ellipse)\b/g, '<$1 pathLength="1"');
  const emblem = (k) =>
    `<svg class="emblem" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawable(ICON[k])}</svg>`;
  const small = (k) =>
    `<svg class="ico" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const divider = `<div class="divider" aria-hidden="true"><svg viewBox="0 0 160 22" fill="none" stroke="currentColor"><path pathLength="1" d="M6 11H66M94 11H154" stroke-width=".8" stroke-linecap="round"/><ellipse pathLength="1" cx="80" cy="11" rx="7" ry="9.5" stroke-width=".9"/><ellipse pathLength="1" cx="80" cy="11" rx="4.4" ry="6.6" stroke-width=".6"/></svg></div>`;
  const head = (k) => `<div class="fx-draw">${divider}${emblem(k)}</div>`;

  /* ------------------------------ links ------------------------------ */
  const start = new Date(C.start), end = new Date(C.end);
  const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = `${C.bride} & ${C.groom}`;
  const where = `${C.venue}, ${C.area}`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding RSVP//MS", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${stamp(start)}-${title.replace(/\W+/g, "")}@wedding-rsvp`,
    `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${C.kicker} ${title}`, `LOCATION:${where}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const icsHref = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  const gcal =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(`${C.kicker} ${title}`)}&dates=${stamp(start)}/${stamp(end)}&location=${encodeURIComponent(where)}`;
  const mapsHref = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.mapsQuery);
  const tel = C.contact.phone;
  const wa = "https://wa.me/" + tel.replace(/\D/g, "");
  const deadline = `${C.weekday}, ${C.day} ${C.monthYear}`;

  /* ------------------------------ greeting as words (lit one by one) ------------------------------ */
  const greet = "Dengan penuh kesyukuran ke hadrat Ilahi, kami dengan segala hormatnya menjemput Tuan/Puan ke majlis perkahwinan {b} dan {g}. Kehadiran serta doa restu Tuan/Puan amatlah kami hargai.";
  let wi = 0;
  const greetHtml = greet.split(" ").map((tok) => {
    const m = tok.match(/^\{(b|g)\}(.*)$/);
    if (m) return `<span class="w gn" style="--i:${wi++}">${esc(m[1] === "b" ? C.bride : C.groom)}</span>${esc(m[2])}`;
    return `<span class="w" style="--i:${wi++}">${esc(tok)}</span>`;
  }).join(" ");

  /* ------------------------------ markup ------------------------------ */
  const SECTIONS = 9; // dots: greeting, couple, date, dress, location, rsvp, wishes, salam kaut, contact

  root.innerHTML = `
  <div class="paper" aria-hidden="true"><span class="a"></span><span class="b"></span></div>

  <header class="cover" id="cover">
    <p class="kicker">${esc(C.kicker)}</p>
    <div class="frame" id="frame">
      <div class="glass">
        <h1 class="names">
          <svg class="monogram" viewBox="0 0 96 52" aria-hidden="true"><text x="34" y="42" text-anchor="middle">${esc(C.bride[0])}</text><text x="58" y="42" text-anchor="middle" opacity=".92">${esc(C.groom[0])}</text></svg>
          <span class="n">${esc(C.bride)}</span>
          <span class="amp-s">&amp;</span>
          <span class="n">${esc(C.groom)}</span>
        </h1>
        <svg class="rule" viewBox="0 0 160 22" fill="none" stroke="currentColor" aria-hidden="true"><path d="M6 11H66M94 11H154" stroke-width=".8" stroke-linecap="round"/><ellipse cx="80" cy="11" rx="7" ry="9.5" stroke-width=".9"/><ellipse cx="80" cy="11" rx="4.4" ry="6.6" stroke-width=".6"/></svg>
        <p class="date">${esc(C.weekday)}, ${esc(C.day)} ${esc(C.monthYear)}<span class="hijri">${esc(C.hijri)}</span></p>
      </div>
      <div class="wreath" id="wreath" aria-hidden="true"></div>
    </div>
    <button class="btn" id="open" type="button">Buka</button>
  </header>

  <div class="content" id="content" hidden>
    <div class="atmos" id="atmos" aria-hidden="true"><span class="glow ga"></span><span class="glow gb"></span><span class="petal p1"></span><span class="petal p2"></span><span class="petal p3"></span><span class="petal p4"></span><span class="petal p5"></span></div>
    <ol class="dots" aria-hidden="true">${Array.from({ length: SECTIONS }, () => "<li></li>").join("")}</ol>

    <div class="sections">
      <section class="sec fxs" id="s-greet">
        <p class="eyebrow fx" style="--y:30px">Assalamualaikum W.B.T. &amp; Salam Sejahtera</p>
        <p class="body fx" style="--d:.12s">${greetHtml}</p>
      </section>

      <section class="sec fxs" id="s-couple">
        ${head("rings")}
        <h2 class="fx" style="--y:40px;--d:.25s">Bersama kami meraikan</h2>
        <div class="people">
          <p class="person fx" style="--y:30px;--d:.4s">${esc(C.bride)}</p>
          <p class="amp" aria-hidden="true"><span class="line l"></span><span class="love">&amp;</span><span class="line r"></span></p>
          <p class="person fx" style="--y:30px;--d:.7s">${esc(C.groom)}</p>
        </div>
      </section>

      <section class="sec fxs" id="s-date">
        ${head("calendar")}
        <h2 class="fx" style="--y:40px;--d:.25s">Simpan tarikh</h2>
        <div class="spread">
          <p class="s-kicker fx-track">${esc(C.weekday)}</p>
          <p class="mask"><span class="s-day">${esc(C.day)}</span></p>
          <p class="s-line fx-open">${esc(C.monthYear)}</p>
          <p class="s-hijri fx" style="--y:30px;--d:.9s">${esc(C.hijri)}</p>
          <p class="s-sub fx" style="--y:30px;--d:1s">${esc(C.time)}</p>
        </div>
        <div class="countdown fx-card" id="countdown" style="--d:1.1s">
          <div class="cell"><span class="v" data-u="d">0</span><span class="l">Hari</span></div>
          <div class="cell"><span class="v" data-u="h">0</span><span class="l">Jam</span></div>
          <div class="cell"><span class="v" data-u="m">0</span><span class="l">Minit</span></div>
          <div class="cell"><span class="v" data-u="s">0</span><span class="l">Saat</span></div>
        </div>
        <div class="actions fx" style="--d:1.4s">
          <a class="btn-o" href="${icsHref}" download="${esc(title.replace(/\W+/g, "-").toLowerCase())}.ics">${small("calendar")}Simpan dalam kalendar</a>
          <a class="btn-o" href="${gcal}" target="_blank" rel="noopener">${small("calendar")}Simpan dalam Google Calendar</a>
        </div>
      </section>

      <section class="sec fxs" id="s-dress">
        ${head("hanger")}
        <h2 class="fx" style="--y:40px;--d:.25s">Kod pakaian</h2>
        <ul class="swatches">${C.dressCode.map((c, i) => `<li class="fx-spin" style="--d:${0.5 + i * 0.12}s"><span class="sw" style="background:${esc(c)}"></span></li>`).join("")}</ul>
      </section>

      <section class="sec fxs" id="s-loc">
        ${head("pin")}
        <h2 class="fx" style="--y:40px;--d:.25s">Lokasi</h2>
        <div class="spread">
          <p class="s-venue fx-wipe">${esc(C.venue)}</p>
          <p class="s-sub fx" style="--y:30px;--d:.75s">${esc(C.area)}</p>
        </div>
        <svg class="route" viewBox="0 0 400 90" fill="none" stroke="currentColor" aria-hidden="true">
          <defs><mask id="roadMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="90"><path class="rm" pathLength="1" d="M8 70C70 70 70 22 140 22S210 68 270 62 330 62 352 62" stroke="#fff" stroke-width="16" stroke-linecap="butt"/></mask></defs>
          <path class="road" mask="url(#roadMask)" d="M8 70C70 70 70 22 140 22S210 68 270 62 330 62 352 62" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 7"/>
          <g class="pin"><path d="M352 62C352 62 340 48 340 40A12 12 0 1 1 364 40C364 48 352 62 352 62ZM352 35A5 5 0 1 0 352.1 35" stroke-width="2.2" stroke-linejoin="round"/></g>
        </svg>
        <div class="actions fx" style="--d:1.5s">
          <a class="btn-o" href="${mapsHref}" target="_blank" rel="noopener" aria-label="Buka di Google Maps">${small("pin")}Google Maps</a>
        </div>
      </section>

      <section class="sec fxs" id="s-rsvp">
        ${head("envelope")}
        <h2 class="fx" style="--y:40px;--d:.25s">RSVP</h2>
        <form class="card rsvp fx-card fx-kids" id="form" style="--d:.45s" novalidate>
          <p class="muted by">Sila sahkan kehadiran sebelum ${esc(deadline)}.</p>
          <label class="field"><span class="label">Nama</span>
            <input class="input" id="name" name="name" type="text" autocomplete="name" maxlength="80" required />
            <span class="err" id="nameErr" role="alert" hidden></span>
          </label>
          <div class="field">
            <div class="choice" role="group" aria-label="Kehadiran">
              <button class="choice-btn" type="button" data-v="yes" aria-pressed="false">Hadir</button>
              <button class="choice-btn" type="button" data-v="no" aria-pressed="false">Tidak hadir</button>
            </div>
            <span class="err" id="choiceErr" role="alert" hidden></span>
          </div>
          <div class="field" id="paxField" hidden>
            <span class="label" id="paxLabel">Bilangan tetamu (termasuk anda)</span>
            <div class="stepper" role="group" aria-labelledby="paxLabel">
              <button type="button" id="minus" aria-label="Kurangkan">−</button>
              <output id="pax" aria-live="polite">1</output>
              <button type="button" id="plus" aria-label="Tambah">+</button>
            </div>
          </div>
          <label class="field"><span class="label">Ucapan untuk tuan rumah (tak wajib)</span>
            <textarea class="input" id="msg" name="message" rows="3" maxlength="300"></textarea>
            <span class="muted hint">Ucapan akan dipaparkan dalam kad bersama nama anda.</span>
          </label>
          <input class="trap" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <p class="err" id="formErr" role="alert" hidden></p>
          <button class="btn" id="send" type="submit">Hantar</button>
        </form>
        <div class="card thanks" id="thanks" hidden>
          <p class="t-title">Terima kasih!</p>
          <p class="muted" id="thanksText"></p>
          <button class="btn-o" id="again" type="button">Hantar maklum balas lain</button>
        </div>
      </section>

      <section class="sec fxs" id="s-wishes">
        ${head("chat")}
        <h2 class="fx" style="--y:40px;--d:.25s">Ucapan</h2>
        <p class="muted fx" id="wishesEmpty" style="--y:30px;--d:.45s">Ucapan daripada tetamu akan dipaparkan di sini.</p>
        <ul class="wishes" id="wishes"></ul>
      </section>

      <section class="sec fxs" id="s-gift">
        ${head("gift")}
        <h2 class="fx" style="--y:40px;--d:.25s">Salam Kaut</h2>
        <p class="muted fx" style="--d:.4s">Kehadiran dan doa anda sudah cukup bermakna. Bagi yang ingin menghulurkan salam kaut, boleh salurkan ke:</p>
        <div class="card gift fx-card fx-kids" style="--d:.6s">
          <span class="shine" aria-hidden="true"></span>
          <p><span class="label muted">Bank</span><span class="value">${esc(C.salamKaut.bank)}</span></p>
          <p><span class="label muted">No. akaun</span><span class="value acct">${esc(C.salamKaut.account)}</span></p>
          <p><span class="label muted">Nama pemegang akaun</span><span class="value">${esc(C.salamKaut.holder)}</span></p>
          <div class="actions"><button class="btn-o" id="copy" type="button" data-acct="${esc(C.salamKaut.account)}"><span class="copy-l">Salin nombor</span></button></div>
        </div>
      </section>

      <section class="sec fxs" id="s-contact">
        ${head("phone")}
        <h2 class="fx" style="--y:40px;--d:.25s">Untuk sebarang pertanyaan</h2>
        <ul class="contacts fx" style="--d:.45s">
          <li class="card"><p class="value">${esc(C.contact.name)}</p>
            <div class="actions row"><a class="btn-s fx-pop" style="--d:.9s" href="tel:${esc(tel)}">Call</a><a class="btn-s o fx-pop" style="--d:1.05s" href="${wa}" target="_blank" rel="noopener">WhatsApp</a></div></li>
        </ul>
      </section>

      <div class="finale fxs" id="s-finale">
        <p class="thanks-l muted fx" style="--y:24px">Kehadiran anda amat kami hargai</p>
        <p class="mask"><span class="f-title">${esc(C.bride)} &amp; ${esc(C.groom)}</span></p>
        <p class="replay fx" style="--d:.9s"><button class="btn-o" id="replay" type="button">Tengok semula dari awal</button></p>
      </div>
    </div>

    <nav class="quickbar" aria-label="Pintasan"><div class="qb-inner">
      <button class="qb" type="button" data-to="s-loc">${small("pin")}<span>Peta</span></button>
      <button class="qb" type="button" data-to="s-date">${small("calendar")}<span>Tarikh</span></button>
      <button class="qb" type="button" data-to="s-rsvp">${small("envelope")}<span>RSVP</span></button>
      <button class="qb" type="button" data-to="s-gift">${small("gift")}<span>Salam Kaut</span></button>
      <button class="qb" type="button" data-to="s-contact">${small("phone")}<span>Hubungi</span></button>
    </div></nav>
  </div>

  <div class="music-dock" id="dock" hidden>
    <button class="music" id="music" type="button" aria-label="Main lagu" aria-pressed="false">
      <svg class="m-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
      <svg class="m-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>
    </button>
  </div>`;

  // Stagger indexes for "kids" groups (form fields, gift rows).
  $$(".fx-kids").forEach((p) => [...p.children].filter((c) => !c.classList.contains("shine")).forEach((c, i) => c.style.setProperty("--i", i)));

  /* ------------------------------ wreath ------------------------------ */
  const wreathHost = $("#wreath");
  const img = new Image();
  img.alt = "";
  img.onload = () => wreathHost.replaceChildren(img);
  wreathHost.replaceChildren(window.buildWreath()); // drawn flowers show immediately
  img.src = C.wreathImage; // swapped in only if a real image exists (a missing file is silently ignored)

  /* ------------------------------ music ------------------------------ */
  const content = $("#content"), cover = $("#cover"), dock = $("#dock");
  let audio = null, hasSong = false, playing = false;

  fetch(C.song, { method: "HEAD" })
    .then((r) => { hasSong = r.ok && /audio|octet/.test(r.headers.get("content-type") || ""); })
    .catch(() => {});

  function setPlaying(on) {
    playing = on;
    $("#music").setAttribute("aria-pressed", String(on));
    dock.classList.toggle("on", on);
  }
  function play() {
    if (!hasSong) return;
    audio ||= Object.assign(new Audio(C.song), { loop: true });
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  $("#music").addEventListener("click", () => {
    if (!audio) return play();
    if (playing) { audio.pause(); setPlaying(false); } else play();
  });

  /* ------------------------------ scroll reveals ------------------------------ */
  let io, so;
  function observe() {
    io?.disconnect(); so?.disconnect();
    io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    $$(".fxs").forEach((s) => io.observe(s));

    const lis = $$(".dots li"), secs = $$(".sec");
    so = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { const i = secs.indexOf(e.target); lis.forEach((l, k) => l.classList.toggle("on", k === i)); }
    }), { rootMargin: "-45% 0px -45% 0px" });
    secs.forEach((s) => so.observe(s));
  }
  function resetReveals() {
    io?.disconnect(); so?.disconnect();
    $$(".fxs.in").forEach((s) => s.classList.remove("in"));
    $$(".dots li.on").forEach((l) => l.classList.remove("on"));
  }

  // Scroll-linked parallax for the glows behind the content.
  const atmos = $("#atmos");
  let raf = 0;
  addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; atmos.style.setProperty("--sy", String(Math.round(scrollY))); });
  }, { passive: true });

  /* ------------------------------ open / replay ------------------------------ */
  let state = "closed"; // closed | opening | open | closing
  const ease = "cubic-bezier(.6,0,.2,1)";

  function openCard() {
    if (state !== "closed") return;
    state = "opening";
    root.dataset.opened = "true";
    content.hidden = false;
    window.scrollTo(0, 0);
    play(); // inside the tap, so browsers allow sound

    if (reduceMotion) {
      cover.hidden = true;
      document.body.classList.remove("locked");
      observe(); root.dataset.ready = "true"; dock.hidden = !hasSong; state = "open";
      return;
    }

    // Zoom through the oval: the cover scales up around the oval's centre and dissolves into the card.
    const fr = $("#frame").getBoundingClientRect(), cr = cover.getBoundingClientRect();
    cover.style.transformOrigin = `${fr.left + fr.width / 2 - cr.left}px ${fr.top + fr.height / 2 - cr.top}px`;
    cover.style.pointerEvents = "none";

    $("#open").animate([{ transform: "scale(1)" }, { transform: "scale(.92)" }, { transform: "scale(1)" }], { duration: 240, easing: "ease-out" });
    for (const el of [$(".kicker", cover), $("#open")]) {
      el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-14px)" }], { duration: 420, delay: 120, easing: "ease-out", fill: "forwards" });
    }
    $("#wreath").animate(
      [{ transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(1.3) rotate(5deg)", opacity: 0 }],
      { duration: 1300, delay: 120, easing: ease, fill: "forwards" },
    );
    const zoom = cover.animate(
      [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(2.6)", opacity: 1, offset: 0.62 }, { transform: "scale(3.4)", opacity: 0 }],
      { duration: 1900, delay: 120, easing: ease, fill: "forwards" },
    );

    // The card's first section rises in underneath while the cover is still dissolving.
    setTimeout(observe, 950);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cover.hidden = true;
      document.body.classList.remove("locked");
      root.dataset.ready = "true";
      dock.hidden = !hasSong;
      state = "open";
    };
    zoom.onfinish = finish;
    setTimeout(finish, 2100); // fallback: never depend on the finish event alone
  }
  $("#open").addEventListener("click", openCard);

  function replay() {
    if (state !== "open") return;
    state = "closing";
    root.dataset.ready = "false";
    dock.hidden = true;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    setTimeout(() => {
      document.body.classList.add("locked");
      cover.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      cover.hidden = false; // un-hiding also restarts the cover's own entrance animations
      cover.style.pointerEvents = "";
      const back = reduceMotion ? null : cover.animate(
        [{ transform: "scale(3.4)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 1100, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        content.hidden = true; resetReveals(); root.dataset.opened = "false"; state = "closed";
      };
      if (back) { back.onfinish = done; setTimeout(done, 1200); } else done();
    }, reduceMotion ? 0 : 650);
  }
  $("#replay").addEventListener("click", replay);

  $$(".qb").forEach((b) => b.addEventListener("click", () => $("#" + b.dataset.to).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })));

  /* ------------------------------ countdown ------------------------------ */
  const cd = {}; $$("#countdown [data-u]").forEach((e) => (cd[e.dataset.u] = e));
  function tick() {
    let s = Math.max(0, Math.floor((start - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    cd.d.textContent = d; cd.h.textContent = h; cd.m.textContent = m; cd.s.textContent = s;
  }
  tick(); setInterval(tick, 1000);

  /* ------------------------------ copy account ------------------------------ */
  $("#copy").addEventListener("click", async (e) => {
    const btn = e.currentTarget, label = $(".copy-l", btn), acct = btn.dataset.acct;
    try { await navigator.clipboard.writeText(acct); }
    catch {
      const t = Object.assign(document.createElement("textarea"), { value: acct });
      document.body.append(t); t.select(); try { document.execCommand("copy"); } catch { /* ignore */ } t.remove();
    }
    label.textContent = "✓ Disalin";
    setTimeout(() => (label.textContent = "Salin nombor"), 1800);
  });

  /* ------------------------------ RSVP form ------------------------------ */
  let attending = null, pax = 1;
  const setPax = (n) => {
    pax = Math.min(C.maxPax, Math.max(1, n));
    $("#pax").textContent = pax;
    $("#minus").disabled = pax <= 1;
    $("#plus").disabled = pax >= C.maxPax;
  };
  setPax(1);
  const showErr = (id, msg) => { const el = $("#" + id); el.textContent = msg || ""; el.hidden = !msg; };

  $$(".choice-btn").forEach((b) => b.addEventListener("click", () => {
    attending = b.dataset.v === "yes";
    $$(".choice-btn").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("#paxField").hidden = !attending;
    showErr("choiceErr");
  }));
  $("#minus").addEventListener("click", () => setPax(pax - 1));
  $("#plus").addEventListener("click", () => setPax(pax + 1));
  $("#name").addEventListener("input", () => showErr("nameErr"));

  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#name").value.replace(/\s+/g, " ").trim();
    showErr("nameErr"); showErr("choiceErr"); showErr("formErr");
    if (name.length < 2) { showErr("nameErr", "Sila masukkan nama anda."); $("#name").focus(); return; }
    if (attending === null) { showErr("choiceErr", "Sila pilih Hadir atau Tidak hadir."); return; }

    const btn = $("#send");
    btn.disabled = true; btn.textContent = "Menghantar…";
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, attending, pax, message: $("#msg").value, website: e.target.website.value }),
      });
      if (!res.ok) throw new Error("server");
      $("#thanksText").textContent = attending
        ? `Kami telah mencatat ${name} untuk ${pax} orang tetamu. Jumpa pada ${C.day} ${C.monthYear.split(" ")[0]}!`
        : `Terima kasih kerana memaklumkan, ${name}. Doa anda amat kami hargai.`;
      $("#form").hidden = true;
      $("#thanks").hidden = false;
      loadWishes();
    } catch (err) {
      showErr("formErr", err.message === "server" ? "Maaf, penghantaran gagal. Sila cuba lagi." : "Tiada sambungan. Sila semak internet anda dan cuba lagi.");
    } finally {
      btn.disabled = false; btn.textContent = "Hantar";
    }
  });
  $("#again").addEventListener("click", () => {
    $("#form").reset(); attending = null; setPax(1);
    $$(".choice-btn").forEach((x) => x.setAttribute("aria-pressed", "false"));
    $("#paxField").hidden = true;
    $("#thanks").hidden = true; $("#form").hidden = false; $("#name").focus();
  });

  /* ------------------------------ wishes ------------------------------ */
  async function loadWishes() {
    try {
      const res = await fetch("/api/wishes");
      if (!res.ok) return;
      const { wishes } = await res.json();
      $("#wishes").replaceChildren(...wishes.map((w, i) => {
        const li = document.createElement("li");
        li.className = "card wish";
        li.style.setProperty("--i", i);
        const q = document.createElement("p"); q.className = "w-msg"; q.textContent = w.message;
        const n = document.createElement("p"); n.className = "w-name"; n.textContent = w.name;
        li.append(q, n);
        return li;
      }));
      $("#wishesEmpty").hidden = wishes.length > 0;
    } catch { /* leave the empty-state text */ }
  }
  loadWishes();
})();
