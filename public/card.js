"use strict";
// Builds the invitation from window.CARD (config.js) and wires up all behaviour.
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
  const emblem = (k) =>
    `<svg class="emblem" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const small = (k) =>
    `<svg class="ico" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const divider = `<div class="divider" aria-hidden="true"><svg viewBox="0 0 160 22" fill="none" stroke="currentColor"><path d="M6 11H66M94 11H154" stroke-width=".8" stroke-linecap="round"/><ellipse cx="80" cy="11" rx="7" ry="9.5" stroke-width=".9"/><ellipse cx="80" cy="11" rx="4.4" ry="6.6" stroke-width=".6"/></svg></div>`;

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

  /* ------------------------------ markup ------------------------------ */
  const SECTIONS = ["Ucapan salam", "Bersama", "Tarikh", "Kod pakaian", "Lokasi", "RSVP", "Ucapan", "Salam Kaut", "Hubungi"];

  root.innerHTML = `
  <div class="paper" aria-hidden="true"><span class="a"></span><span class="b"></span></div>

  <header class="cover" id="cover">
    <p class="kicker">${esc(C.kicker)}</p>
    <div class="frame">
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
    <div class="atmos" aria-hidden="true"><span class="glow ga"></span><span class="glow gb"></span><span class="petal p1"></span><span class="petal p2"></span><span class="petal p3"></span><span class="petal p4"></span><span class="petal p5"></span></div>
    <ol class="dots" aria-hidden="true">${SECTIONS.map(() => "<li></li>").join("")}</ol>

    <div class="sections">
      <section class="sec" id="s-greet">
        <p class="eyebrow rv">Assalamualaikum W.B.T. &amp; Salam Sejahtera</p>
        <p class="body rv" style="--d:.12s">Dengan penuh kesyukuran ke hadrat Ilahi, kami dengan segala hormatnya menjemput Tuan/Puan ke majlis perkahwinan <span class="gn">${esc(C.bride)}</span> dan <span class="gn">${esc(C.groom)}</span>. Kehadiran serta doa restu Tuan/Puan amatlah kami hargai.</p>
      </section>

      <section class="sec" id="s-couple">
        <div class="rv">${divider}${emblem("rings")}</div>
        <h2 class="rv" style="--d:.1s">Bersama kami meraikan</h2>
        <div class="people rv" style="--d:.2s">
          <p class="person">${esc(C.bride)}</p>
          <p class="amp" aria-hidden="true"><span class="line"></span><span class="love">&amp;</span><span class="line"></span></p>
          <p class="person">${esc(C.groom)}</p>
        </div>
      </section>

      <section class="sec" id="s-date">
        <div class="rv">${divider}${emblem("calendar")}</div>
        <h2 class="rv" style="--d:.1s">Simpan tarikh</h2>
        <div class="spread rv" style="--d:.15s">
          <p class="s-kicker">${esc(C.weekday)}</p>
          <p class="s-day">${esc(C.day)}</p>
          <p class="s-line">${esc(C.monthYear)}</p>
          <p class="s-hijri">${esc(C.hijri)}</p>
          <p class="s-sub">${esc(C.time)}</p>
        </div>
        <div class="countdown rv" id="countdown" style="--d:.2s">
          <div class="cell"><span class="v" data-u="d">0</span><span class="l">Hari</span></div>
          <div class="cell"><span class="v" data-u="h">0</span><span class="l">Jam</span></div>
          <div class="cell"><span class="v" data-u="m">0</span><span class="l">Minit</span></div>
          <div class="cell"><span class="v" data-u="s">0</span><span class="l">Saat</span></div>
        </div>
        <div class="actions rv" style="--d:.25s">
          <a class="btn-o" href="${icsHref}" download="${esc(title.replace(/\W+/g, "-").toLowerCase())}.ics">${small("calendar")}Simpan dalam kalendar</a>
          <a class="btn-o" href="${gcal}" target="_blank" rel="noopener">${small("calendar")}Simpan dalam Google Calendar</a>
        </div>
      </section>

      <section class="sec" id="s-dress">
        <div class="rv">${divider}${emblem("hanger")}</div>
        <h2 class="rv" style="--d:.1s">Kod pakaian</h2>
        <ul class="swatches rv" style="--d:.15s">${C.dressCode.map((c) => `<li><span class="sw" style="background:${esc(c)}"></span></li>`).join("")}</ul>
      </section>

      <section class="sec" id="s-loc">
        <div class="rv">${divider}${emblem("pin")}</div>
        <h2 class="rv" style="--d:.1s">Lokasi</h2>
        <div class="spread rv" style="--d:.15s">
          <p class="s-venue">${esc(C.venue)}</p>
          <p class="s-sub">${esc(C.area)}</p>
        </div>
        <svg class="route rv" viewBox="0 0 400 90" fill="none" stroke="currentColor" aria-hidden="true"><path class="road" d="M8 70C70 70 70 22 140 22S210 68 270 62 330 62 352 62" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 7"/><path d="M352 62C352 62 340 48 340 40A12 12 0 1 1 364 40C364 48 352 62 352 62ZM352 35A5 5 0 1 0 352.1 35" stroke-width="2.2" stroke-linejoin="round"/></svg>
        <div class="actions rv" style="--d:.2s">
          <a class="btn-o" href="${mapsHref}" target="_blank" rel="noopener" aria-label="Buka di Google Maps">${small("pin")}Google Maps</a>
        </div>
      </section>

      <section class="sec" id="s-rsvp">
        <div class="rv">${divider}${emblem("envelope")}</div>
        <h2 class="rv" style="--d:.1s">RSVP</h2>
        <form class="card rsvp rv" id="form" style="--d:.15s" novalidate>
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
        <div class="card thanks rv" id="thanks" hidden>
          <p class="t-title">Terima kasih!</p>
          <p class="muted" id="thanksText"></p>
          <button class="btn-o" id="again" type="button">Hantar maklum balas lain</button>
        </div>
      </section>

      <section class="sec" id="s-wishes">
        <div class="rv">${divider}${emblem("chat")}</div>
        <h2 class="rv" style="--d:.1s">Ucapan</h2>
        <p class="muted rv" id="wishesEmpty" style="--d:.15s">Ucapan daripada tetamu akan dipaparkan di sini.</p>
        <ul class="wishes" id="wishes"></ul>
      </section>

      <section class="sec" id="s-gift">
        <div class="rv">${divider}${emblem("gift")}</div>
        <h2 class="rv" style="--d:.1s">Salam Kaut</h2>
        <p class="muted rv" style="--d:.15s">Kehadiran dan doa anda sudah cukup bermakna. Bagi yang ingin menghulurkan salam kaut, boleh salurkan ke:</p>
        <div class="card gift rv" style="--d:.2s">
          <span class="shine" aria-hidden="true"></span>
          <p><span class="label muted">Bank</span><span class="value">${esc(C.salamKaut.bank)}</span></p>
          <p><span class="label muted">No. akaun</span><span class="value acct">${esc(C.salamKaut.account)}</span></p>
          <p><span class="label muted">Nama pemegang akaun</span><span class="value">${esc(C.salamKaut.holder)}</span></p>
          <div class="actions"><button class="btn-o" id="copy" type="button" data-acct="${esc(C.salamKaut.account)}"><span class="copy-l">Salin nombor</span></button></div>
        </div>
      </section>

      <section class="sec" id="s-contact">
        <div class="rv">${divider}${emblem("phone")}</div>
        <h2 class="rv" style="--d:.1s">Untuk sebarang pertanyaan</h2>
        <ul class="contacts rv" style="--d:.15s">
          <li class="card"><p class="value">${esc(C.contact.name)}</p>
            <div class="actions row"><a class="btn-s" href="tel:${esc(tel)}">Call</a><a class="btn-s o" href="${wa}" target="_blank" rel="noopener">WhatsApp</a></div></li>
        </ul>
      </section>

      <div class="finale">
        <p class="thanks-l muted rv">Kehadiran anda amat kami hargai</p>
        <p class="f-title rv" style="--d:.1s">${esc(C.bride)} &amp; ${esc(C.groom)}</p>
      </div>
      <p class="replay"><button class="btn-o" id="replay" type="button">Tengok semula dari awal</button></p>
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

  /* ------------------------------ wreath ------------------------------ */
  const wreathHost = $("#wreath");
  const img = new Image();
  img.alt = "";
  img.onload = () => { wreathHost.replaceChildren(img); };
  img.onerror = () => { wreathHost.replaceChildren(window.buildWreath()); };
  wreathHost.replaceChildren(window.buildWreath()); // show drawn flowers immediately
  img.src = C.wreathImage; // swap if a real image exists

  /* ------------------------------ open / replay ------------------------------ */
  const content = $("#content"), cover = $("#cover");
  let audio = null, hasSong = false, playing = false;

  fetch(C.song, { method: "HEAD" })
    .then((r) => { hasSong = r.ok && /audio|octet/.test(r.headers.get("content-type") || ""); })
    .catch(() => {});

  function setPlaying(on) {
    playing = on;
    $("#music").setAttribute("aria-pressed", String(on));
    $("#dock").classList.toggle("on", on);
  }
  function play() {
    if (!hasSong) return;
    audio ||= Object.assign(new Audio(C.song), { loop: true });
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function openCard() {
    root.dataset.opened = "true";
    document.body.classList.remove("locked");
    content.hidden = false;
    observe();
    if (hasSong) { $("#dock").hidden = false; play(); }
    requestAnimationFrame(() => window.scrollTo({ top: cover.offsetHeight, behavior: reduceMotion ? "auto" : "smooth" }));
  }
  $("#open").addEventListener("click", openCard);

  $("#replay").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    setTimeout(() => {
      root.dataset.opened = "false";
      document.body.classList.add("locked");
      content.hidden = true;
      $$(".rv.in").forEach((e) => e.classList.remove("in"));
    }, reduceMotion ? 0 : 800);
  });

  $("#music").addEventListener("click", () => {
    if (!audio) return play();
    if (playing) { audio.pause(); setPlaying(false); } else play();
  });

  /* ------------------------------ reveal + dots ------------------------------ */
  let io, so;
  function observe() {
    io?.disconnect(); so?.disconnect();
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    $$(".rv").forEach((e) => io.observe(e));
    const lis = $$(".dots li");
    so = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { const i = $$(".sec").indexOf(e.target); lis.forEach((l, k) => l.classList.toggle("on", k === i)); }
    }), { rootMargin: "-45% 0px -45% 0px" });
    $$(".sec").forEach((s) => so.observe(s));
  }

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
  let attending = null, pax = 1, lastName = "";
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
      lastName = name;
      $("#thanksText").textContent = attending
        ? `Kami telah mencatat ${name} untuk ${pax} orang tetamu. Jumpa pada ${C.day} ${C.monthYear.split(" ")[0]}!`
        : `Terima kasih kerana memaklumkan, ${name}. Doa anda amat kami hargai.`;
      $("#form").hidden = true;
      $("#thanks").hidden = false; $("#thanks").classList.add("in");
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
  void lastName;

  /* ------------------------------ wishes ------------------------------ */
  async function loadWishes() {
    try {
      const res = await fetch("/api/wishes");
      if (!res.ok) return;
      const { wishes } = await res.json();
      const ul = $("#wishes");
      ul.replaceChildren(...wishes.map((w) => {
        const li = document.createElement("li");
        li.className = "card wish";
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
