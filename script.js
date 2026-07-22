// ============================================================
//  DATA — Edit events here. Each event can have up to 5 images.
//  For image, put URL string or leave as "" to show emoji.
// ============================================================
const EVENTS = [
  {
    id: 0,
    title: "PARTY WITH CLASS OF 26",
    category: "",
    emoji: "",
    images: ["host1.jpeg", "host2.jpg", "pro1.jpg","pro2.jpg" ,"pro3.jpg" , "pro4.jpg","pro5.jpg" ,"pro6.jpg" , "pro7.jpg", "pro8.jpg", "pro9.jpg", "pro10.jpg", "pro11.jpg", "pro2.jpg", "pro13.jpg", "pro14.jpg"],  // Replace with image URLs
    date: "21 November 2026",
    time: "16:00 - 06:00",
    venue: "Sasolburg (Near Astro)",
    city: "Sasolburg",
    price: "General - R80",
    price: "@The Gate - R100",
    price: "VIP - R150",
    description: "Calling all Matriculants of 2026! This one's for you, a celebration built specifically for the Class of 26 as you close this chapter in style. Join us on 21 November for a night of good music, good vibes, and an unforgettable crowd of matriculants coming together to celebrate the journey.",
    extra: "",
    going: 0,    // ← YOU CAN CHEAT THE COUNT HERE
    interested: 0,
    featured: false
  },

];

// ============================================================
//  State
// ============================================================
let userReactions = JSON.parse(localStorage.getItem("fe_reactions") || "{}");
let reactions = {};
let currentCategoryFilter = "all";

function saveReactions() {
  localStorage.setItem("fe_reactions", JSON.stringify(userReactions));
}

// Init from event data
EVENTS.forEach(e => {
  reactions[e.id] = { going: e.going, interested: e.interested };
});

// Featured = first event with featured:true, or first event
const featuredEvent = EVENTS.find(e => e.featured) || EVENTS[0];
let currentShareEventId = null;
let viewerImages = [];
let viewerIndex = 0;
let viewerEventId = null;

// Admin secret
let adminBuffer = "";
document.addEventListener("keydown", e => {
  adminBuffer += e.key;
  if (adminBuffer.toLowerCase().endsWith("admin")) {
    adminBuffer = "";
    openAdmin();
  }
  if (adminBuffer.length > 20) adminBuffer = adminBuffer.slice(-10);
});

// ============================================================
//  RENDER
// ============================================================
function renderHero() {
  const ev = featuredEvent;
  document.getElementById("heroTitle").textContent = ev.title;

  let metaHTML = "";
  metaHTML += `<div class="hero-meta-item"><span class="hero-meta-icon icon-date">📅</span>${ev.date} · ${ev.time}</div>`;
  metaHTML += `<div class="hero-meta-item"><span class="hero-meta-icon icon-venue">📍</span>${ev.venue}, ${ev.city}</div>`;
  metaHTML += `<div class="hero-meta-item"><span class="hero-meta-icon icon-price">💰</span>${ev.price}</div>`;
  if (ev.extra) metaHTML += `<div class="hero-meta-item"><span class="hero-meta-icon" style="background:rgba(255,255,255,0.2)">ℹ️</span>${ev.extra}</div>`;
  document.getElementById("heroMeta").innerHTML = metaHTML;
  document.getElementById("heroDesc").textContent = ev.description;

  const imgs = ev.images || [];
  const mainEl = document.getElementById("heroMainImg");
  mainEl.className = "hero-img-placeholder";
  mainEl.onclick = () => openViewer(0, ev.id);

  if (imgs[0]) {
    mainEl.innerHTML = `<img src="${imgs[0]}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover;border-radius:18px;" onerror="this.parentElement.innerHTML='${ev.emoji}'">`;
  } else {
    mainEl.innerHTML = ev.emoji;
  }

  // Thumbnails
  const thumbRow = document.getElementById("heroThumbRow");
  thumbRow.innerHTML = "";
  imgs.forEach((img, i) => {
    if (!img) return;
    const t = document.createElement("div");
    t.className = "hero-thumb" + (i === 0 ? " active" : "");
    t.innerHTML = `<img src="${img}" alt="thumb" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">`;
    t.onclick = () => {
      document.querySelectorAll(".hero-thumb").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      openViewer(i, ev.id);
    };
    thumbRow.appendChild(t);
  });
}

function renderGrid(filtered = null) {
  const grid = document.getElementById("eventsGrid");
  const list = filtered !== null ? filtered : EVENTS;
  grid.innerHTML = "";

  if (list.length === 0) {
    document.getElementById("noResults").style.display = "block";
    return;
  }
  document.getElementById("noResults").style.display = "none";

  list.forEach(ev => {
    const r = reactions[ev.id];
    const ur = userReactions[ev.id] || null;
    const imgs = ev.images || [];
    const imgCount = imgs.filter(x => x).length;

    let imgHTML;
    if (imgs[0]) {
      imgHTML = `<img src="${imgs[0]}" alt="${ev.title}" onerror="this.style.display='none'">`;
    } else {
      imgHTML = ev.emoji;
    }
    const imgIndicator = imgCount > 1 ? `<div class="card-img-indicator">📷 ${imgCount} photos</div>` : "";

    const card = document.createElement("div");
    card.className = "event-card";
    card.dataset.search = (ev.title + " " + ev.city + " " + ev.venue + " " + ev.category + " " + ev.description).toLowerCase();
    card.innerHTML = `
      <div class="card-img-wrap" onclick="openViewer(0, ${ev.id})">
        ${imgHTML}
        <div class="card-category cat-${ev.category}">${ev.category}</div>
        ${imgIndicator}
      </div>
      <div class="card-body">
        <div class="card-title">${ev.title}</div>
        <div class="card-meta">
          <div class="card-meta-row"><span class="meta-emoji">📅</span>${ev.date}</div>
          <div class="card-meta-row"><span class="meta-emoji">⏰</span>${ev.time}</div>
          <div class="card-meta-row"><span class="meta-emoji">📍</span>${ev.venue}, ${ev.city}</div>
        </div>
        <span class="card-price">💰 ${ev.price}</span>
        <p class="card-desc">${ev.description}</p>
        <div class="card-footer">
          <button class="btn-share" onclick="openShare(${ev.id})">📤 Share</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ============================================================
//  FILTERS
// ============================================================
function filterByCategory(category) {
  currentCategoryFilter = category;
  
  // Update active button
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.category === category) {
      btn.classList.add("active");
    }
  });
  
  // Filter events
  let filtered = EVENTS;
  if (category !== "all") {
    filtered = EVENTS.filter(ev => ev.category.toLowerCase() === category.toLowerCase());
  }
  
  renderGrid(filtered);
}

function filterEvents() {
  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  if (!q) { 
    filterByCategory(currentCategoryFilter);
    return; 
  }
  let filtered = EVENTS.filter(ev => {
    const s = (ev.title + " " + ev.city + " " + ev.venue + " " + ev.category + " " + ev.description).toLowerCase();
    return s.includes(q);
  });
  
  // Also filter by category if not showing all
  if (currentCategoryFilter !== "all") {
    filtered = filtered.filter(ev => ev.category.toLowerCase() === currentCategoryFilter.toLowerCase());
  }
  
  renderGrid(filtered);
}

// ============================================================
//  SHARE
// ============================================================
function openShare(evId) {
  currentShareEventId = evId;
  const ev = evId === -1 ? featuredEvent : EVENTS.find(e => e.id === evId);
  document.getElementById("shareEventName").textContent = ev.title;
  const url = `https://future-events.co.za/${ev.id}?utm_source=share&utm_medium=future-events`;
  document.getElementById("shareLink").value = url;
  document.getElementById("shareModal").classList.add("open");
}

function closeShare() {
  document.getElementById("shareModal").classList.remove("open");
}

function shareTo(platform) {
  const ev = currentShareEventId === -1 ? featuredEvent : EVENTS.find(e => e.id === currentShareEventId);
  const url = document.getElementById("shareLink").value;
  const text = `🎉 ${ev.title}
📅 ${ev.date}
📍 ${ev.venue}, ${ev.city}
💰 ${ev.price}

Shared via Future Events - future-events.co.za`;

  const links = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    instagram: null,
    save: null
  };

  if (platform === "instagram") {
    showToast("📸 Copy the link and share on Instagram Stories!");
    return;
  }

  if (platform === "save") {
    showToast("💾 Right-click the event image to save!");
    return;
  }

  if (links[platform]) {
    window.open(links[platform], "_blank");
  }
  closeShare();
}

function copyLink() {
  const input = document.getElementById("shareLink");
  navigator.clipboard.writeText(input.value).then(() => showToast("🔗 Link copied!")).catch(() => {
    input.select();
    document.execCommand("copy");
    showToast("🔗 Link copied!");
  });
}

// ============================================================
//  IMAGE VIEWER
// ============================================================
function openViewer(startIndex, evId) {
  viewerEventId = evId;
  const ev = evId === -1 ? featuredEvent : EVENTS.find(e => e.id === evId);
  viewerImages = (ev.images || []).filter(x => x);
  viewerIndex = startIndex;

  if (viewerImages.length === 0) {
    showToast("No photos for this event yet");
    return;
  }

  renderViewerSlide();
  document.getElementById("imgViewer").classList.add("open");
}

function renderViewerSlide() {
  const ev = viewerEventId === -1 ? featuredEvent : EVENTS.find(e => e.id === viewerEventId);
  const content = document.getElementById("imgViewerContent");
  if (viewerImages.length > 0) {
    content.innerHTML = `<img class="img-viewer-img" src="${viewerImages[viewerIndex]}" alt="Event photo">`;
  } else {
    content.innerHTML = `<span style="font-size:80px">${ev.emoji}</span>`;
  }
}

function viewerPrev() {
  viewerIndex = (viewerIndex - 1 + viewerImages.length) % viewerImages.length;
  renderViewerSlide();
}

function viewerNext() {
  viewerIndex = (viewerIndex + 1) % viewerImages.length;
  renderViewerSlide();
}

function closeViewer() {
  document.getElementById("imgViewer").classList.remove("open");
}

// ============================================================
//  TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ============================================================
//  ADMIN
// ============================================================
function openAdmin() {
  const panel = document.getElementById("adminPanel");
  const list = document.getElementById("adminEventsList");
  list.innerHTML = "";

  EVENTS.forEach(ev => {
    const r = reactions[ev.id];
    const row = document.createElement("div");
    row.className = "admin-event-row";
    row.innerHTML = `
      <div class="admin-event-name">${ev.title}</div>
      <div class="admin-inputs">
        <label>✅</label>
        <input type="number" id="adm-going-${ev.id}" value="${r.going}" min="0">
        <label>⭐</label>
        <input type="number" id="adm-int-${ev.id}" value="${r.interested}" min="0">
        <button class="admin-save-btn" onclick="adminSave(${ev.id})">Save</button>
      </div>
    `;
    list.appendChild(row);
  });

  panel.classList.add("open");
}

function adminSave(evId) {
  const g = parseInt(document.getElementById(`adm-going-${evId}`).value) || 0;
  const i = parseInt(document.getElementById(`adm-int-${evId}`).value) || 0;
  reactions[evId].going = g;
  reactions[evId].interested = i;
  renderGrid();
  updateHeroButtons();
  showToast("✅ Counts updated!");
}

function closeAdmin() {
  document.getElementById("adminPanel").classList.remove("open");
}

// ============================================================
//  INIT
// ============================================================
renderGrid();

// Navbar scroll effect - make transparent on hero, solid when scrolling past
window.addEventListener("scroll", () => {
  const heroSection = document.getElementById("hero");
  const nav = document.querySelector("nav");
  
  if (heroSection && nav) {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    
    if (heroBottom < 70) {
      nav.classList.add("nav-scrolled");
    } else {
      nav.classList.remove("nav-scrolled");
    }
  }
});

// ============================================================
//  HAMBURGER MENU TOGGLE
// ============================================================
(function () {
  const toggle = document.getElementById('mobile-menu');
  const navLinks = document.querySelector('.nav-links');

  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('nav-open');
    toggle.classList.toggle('is-open', isOpen);
    // Prevent body scroll when menu is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('nav-open');
      toggle.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });
})();
