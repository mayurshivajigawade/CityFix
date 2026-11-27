"use strict";
/* Demo-only accounts, stored in this browser. Real authentication must be done by the backend. */
const $ = s => document.querySelector(s);
const ls = {
  get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");

async function hashPw(pw, saltHex) {
  if (!window.crypto || !crypto.subtle) throw new Error("nosubtle");
  const salt = saltHex ? Uint8Array.from(saltHex.match(/../g).map(h => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256);
  return { salt: hex(salt), hash: hex(bits) };
}

function dest() {
  const n = new URLSearchParams(location.search).get("next") || "";
  return /^[\w-]+\.html(#\w+)?$/.test(n) ? n : "index.html#feed";
}

const mark = (id, msg) => {
  const el = $("#" + id), er = $("#e-" + id);
  if (msg) { el.setAttribute("aria-invalid", "true"); el.setAttribute("aria-describedby", "e-" + id); er.textContent = msg; er.hidden = false; }
  else { el.removeAttribute("aria-invalid"); er.hidden = true; }
};
const formErr = (id, msg) => { const e = $("#" + id); e.textContent = msg; e.hidden = !msg; };
const busy = (form, on, label) => {
  const b = form.querySelector(".btn-primary");
  b.disabled = on;
  b.innerHTML = on ? '<span class="spin"></span> Please wait…' : label;
};
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* tabs */
function setTab(mode) {
  const reg = mode === "register";
  $("#t-login").setAttribute("aria-selected", String(!reg));
  $("#t-register").setAttribute("aria-selected", String(reg));
  $("#t-login").tabIndex = reg ? -1 : 0;
  $("#t-register").tabIndex = reg ? 0 : -1;
  $("#f-login").hidden = reg;
  $("#f-register").hidden = !reg;
}
$("#t-login").onclick = () => setTab("login");
$("#t-register").onclick = () => setTab("register");
document.querySelector(".tabs").addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    const reg = $("#t-login").getAttribute("aria-selected") === "true";
    setTab(reg ? "register" : "login");
    $(reg ? "#t-register" : "#t-login").focus();
  }
});
if (location.hash === "#register") setTab("register");

/* show / hide password */
document.querySelectorAll(".show").forEach(b => b.onclick = () => {
  const inp = $("#" + b.dataset.for), show = inp.type === "password";
  inp.type = show ? "text" : "password";
  b.textContent = show ? "Hide" : "Show";
  b.setAttribute("aria-pressed", String(show));
});

/* password strength meter */
$("#r-pw").addEventListener("input", e => {
  const v = e.target.value;
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
  const m = $("#meter");
  m.style.width = (v ? Math.max(s, 1) * 25 : 0) + "%";
  m.style.background = s <= 1 ? "var(--err)" : s < 4 ? "var(--signal)" : "var(--teal)";
});

function done(user) {
  ls.set("cityfix.session", { id: user.id, name: user.name, email: user.email });
  $("#forms").hidden = true;
  const s = $("#signed");
  s.hidden = false;
  s.className = "signed";
  s.setAttribute("role", "status");
  s.innerHTML = '<svg class="check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path d="M20 33l8 8 17-18"/></svg><h1>You’re in, ' + esc(user.name.split(" ")[0]) + '</h1><p class="lede">Taking you to CityFix…</p>';
  setTimeout(() => { location.href = dest(); }, 1100);
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* register */
$("#f-register").onsubmit = async e => {
  e.preventDefault();
  const name = $("#r-name").value.trim(), email = $("#r-email").value.trim().toLowerCase(), pw = $("#r-pw").value;
  const e1 = name.length < 2 ? "Enter your name." : "";
  const e2 = !emailOk(email) ? "Enter a valid email address." : "";
  const e3 = pw.length < 8 ? "Use at least 8 characters." : "";
  mark("r-name", e1); mark("r-email", e2); mark("r-pw", e3); formErr("e-r", "");
  if (e1 || e2 || e3) { $(e1 ? "#r-name" : e2 ? "#r-email" : "#r-pw").focus(); return; }
  busy(e.target, true);
  try {
    const users = ls.get("cityfix.users", []);
    if (users.some(u => u.email === email)) { formErr("e-r", "An account with this email already exists. Log in instead."); busy(e.target, false, "Create account"); return; }
    const { salt, hash } = await hashPw(pw);
    const user = { id: "u" + Date.now(), name, email, salt, hash };
    if (!ls.set("cityfix.users", [...users, user])) throw new Error("storage");
    done(user);
  } catch (err) {
    formErr("e-r", err.message === "nosubtle"
      ? "This browser can’t secure the password on this page. Open the site with Live Server (localhost) and try again."
      : "We couldn’t save your account. Check that browser storage is allowed and try again.");
    busy(e.target, false, "Create account");
  }
};

/* login */
$("#f-login").onsubmit = async e => {
  e.preventDefault();
  const email = $("#l-email").value.trim().toLowerCase(), pw = $("#l-pw").value;
  const e1 = !emailOk(email) ? "Enter a valid email address." : "";
  const e2 = !pw ? "Enter your password." : "";
  mark("l-email", e1); mark("l-pw", e2); formErr("e-l", "");
  if (e1 || e2) { $(e1 ? "#l-email" : "#l-pw").focus(); return; }
  busy(e.target, true);
  try {
    const u = ls.get("cityfix.users", []).find(x => x.email === email);
    const ok = u && (await hashPw(pw, u.salt)).hash === u.hash;
    if (!ok) { formErr("e-l", "Email or password is incorrect."); busy(e.target, false, "Log in"); return; }
    done(u);
  } catch (err) {
    formErr("e-l", err.message === "nosubtle"
      ? "This browser can’t check passwords on this page. Open the site with Live Server (localhost) and try again."
      : "Something went wrong. Try again.");
    busy(e.target, false, "Log in");
  }
};

/* already logged in */
const cur = ls.get("cityfix.session", null);
if (cur) {
  $("#forms").hidden = true;
  const s = $("#signed");
  s.hidden = false;
  s.className = "signed";
  s.innerHTML = '<h1>Hi, ' + esc(cur.name.split(" ")[0]) + '</h1><p class="lede">You’re already logged in.</p><a class="btn btn-primary" href="' + dest() + '">Continue</a><button class="btn" id="lo">Log out</button>';
  $("#lo").onclick = () => { try { localStorage.removeItem("cityfix.session"); } catch (e) {} location.reload(); };
}
