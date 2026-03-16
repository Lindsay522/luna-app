/**
 * Luna — Premium lifestyle app: wardrobe, planning, wellness, focus
 */

(function () {
  "use strict";

  var KEYS = {
    closet: "luna_closet_en",
    outfits: "luna_outfits_en",
    events: "luna_events_en",
    sleep: "luna_sleep_en",
    sport: "luna_sport_en",
    reflections: "luna_reflections_en",
    tomorrow: "luna_tomorrow_en",
    focus: "luna_focus_en",
    onboarding: "luna_onboarding_done_en",
  };

  var MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var ROOM_NAMES = { reset: "Soft reset", study: "Deep study", sleep: "Wind down", yoga: "Stretch break", morning: "Morning start", creative: "Creative focus" };
  var ROOM_GUIDANCE = {
    reset: "Take a breath. Let today’s noise fade. You’re right here.",
    study: "One task at a time. Put your phone away and dive in.",
    sleep: "Dim the lights. This is your cue to slow down and rest.",
    yoga: "Stand or sit. Stretch gently. Breathe in, then out.",
    morning: "Start slow. Hydrate, move a little, then ease into your list.",
    creative: "No judgment. Let ideas flow. You can edit later.",
  };
  var CATEGORY_ICONS = { Tops: "👕", Bottoms: "👖", Outerwear: "🧥", "Shoes & Bags": "👟", Accessories: "✨" };

  // Onboarding
  var onboardingEl = document.getElementById("onboardingOverlay");
  var onboardingDone = document.getElementById("onboardingDone");
  if (onboardingEl && onboardingDone) {
    if (localStorage.getItem(KEYS.onboarding)) onboardingEl.classList.add("hidden");
    onboardingDone.addEventListener("click", function () {
      localStorage.setItem(KEYS.onboarding, "1");
      onboardingEl.classList.add("hidden");
    });
  }

  function storage(key) {
    var defaultVal = key === "focus" || key === "reflections" ? {} : [];
    return {
      get: function () {
        try {
          var raw = localStorage.getItem(KEYS[key] || key);
          return raw ? JSON.parse(raw) : defaultVal;
        } catch (e) {
          return defaultVal;
        }
      },
      set: function (val) {
        try {
          localStorage.setItem(KEYS[key] || key, JSON.stringify(val));
        } catch (e) {}
      },
    };
  }

  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function getMonday(d) {
    var x = new Date(d);
    var day = x.getDay();
    var diff = x.getDate() - (day === 0 ? 7 : day) + 1;
    return new Date(x.getFullYear(), x.getMonth(), diff);
  }

  function showPage(id) {
    if (!id) return;
    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
    var page = document.getElementById("page-" + id);
    if (page) page.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.remove("active");
      if (n.getAttribute("data-nav") === id) n.classList.add("active");
    });
  }

  // Single delegated listener so nav always works (even if other script fails)
  document.body.addEventListener("click", function (e) {
    var link = e.target && e.target.closest && e.target.closest("[data-nav]");
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    var id = link.getAttribute("data-nav");
    if (id) showPage(id);
  });
  window.LunaNavReady = true;

  function setGreeting() {
    var h = new Date().getHours();
    var msg = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    var el = document.getElementById("dashboardGreeting");
    if (el) el.textContent = msg;
  }

  function setDashboardDate() {
    var d = new Date();
    var str = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    var el = document.getElementById("dashboardDate");
    if (el) el.textContent = str;
  }

  function renderDashboardSummary() {
    var sleepList = storage("sleep").get();
    var lastSleep = sleepList[sleepList.length - 1];
    var sleepEl = document.getElementById("dashboardSleep");
    if (sleepEl) {
      if (lastSleep) sleepEl.textContent = (lastSleep.hours || "—") + " hrs";
      else sleepEl.textContent = "—";
    }
    var sportList = storage("sport").get();
    var now = new Date();
    var mon = getMonday(now);
    var weekSport = sportList.filter(function (s) {
      var m = getMonday(new Date(s.date));
      return m.getTime() === mon.getTime();
    });
    var count = weekSport.length;
    var mins = weekSport.reduce(function (sum, s) { return sum + (s.duration || 0); }, 0);
    var moveEl = document.getElementById("dashboardMovement");
    if (moveEl) moveEl.textContent = count === 0 && mins === 0 ? "—" : count + " sessions · " + mins + " min";
  }

  function initFocus() {
    var today = todayStr();
    var data = storage("focus").get();
    var val = typeof data === "object" && data[today] ? data[today] : null;
    document.querySelectorAll(".focus-btn").forEach(function (btn) {
      btn.classList.remove("active");
      if (btn.getAttribute("data-energy") === val) btn.classList.add("active");
      btn.addEventListener("click", function () {
        var v = this.getAttribute("data-energy");
        var o = storage("focus").get();
        if (typeof o !== "object") o = {};
        o[todayStr()] = v;
        storage("focus").set(o);
        document.querySelectorAll(".focus-btn").forEach(function (b) {
          b.classList.toggle("active", b.getAttribute("data-energy") === v);
        });
      });
    });
  }

  function initTomorrowStarter() {
    var el = document.getElementById("tomorrowStarter");
    if (!el) return;
    var saved = localStorage.getItem(KEYS.tomorrow);
    if (saved) el.value = saved;
    el.addEventListener("blur", function () { localStorage.setItem(KEYS.tomorrow, this.value.trim()); });
  }

  setGreeting();
  setDashboardDate();
  renderDashboardSummary();
  initFocus();
  initTomorrowStarter();
  setDashboardInsight();

  function setDashboardInsight() {
    var el = document.getElementById("dashboardInsightText");
    if (!el) return;
    var mood = (function () {
      var data = storage("focus").get();
      var today = todayStr();
      return typeof data === "object" && data[today] ? data[today] : null;
    })();
    var lines = [
      "A small step today is still progress. Be kind to yourself.",
      "You don’t have to do it all. Just the next right thing.",
      "Rest is part of the plan.",
      "Your best today might look different from yesterday. That’s okay.",
    ];
    if (mood === "low" || mood === "ok") lines.push("It’s okay to take things slow. You’re still moving.");
    if (mood === "good" || mood === "great") lines.push("You’re in a good place. Use it gently.");
    el.textContent = lines[Math.floor(Math.random() * lines.length)];
  }

  var closetStore = storage("closet");

  function getClosetFilter() {
    return {
      category: (document.getElementById("filterCategory") && document.getElementById("filterCategory").value) || "",
      season: (document.getElementById("filterSeason") && document.getElementById("filterSeason").value) || "",
    };
  }

  function renderCloset() {
    var list = closetStore.get();
    var filter = getClosetFilter();
    var filtered = list.filter(function (c) {
      if (filter.category && c.category !== filter.category) return false;
      if (filter.season && c.season !== filter.season) return false;
      return true;
    });
    var grid = document.getElementById("closetGrid");
    var empty = document.getElementById("closetEmpty");
    if (!grid) return;
    if (filtered.length === 0) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";
    grid.innerHTML = filtered.map(function (c) {
      var tags = (c.styleTags || "").split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean);
      var tagsHtml = tags.length ? tags.map(function (t) { return '<span class="closet-item-tag">' + escapeHtml(t) + "</span>"; }).join("") : "";
      var price = c.price ? "$" + c.price : "";
      var thumbIcon = CATEGORY_ICONS[c.category] || "✨";
      return '<div class="closet-item" data-id="' + escapeHtml(c.id) + '">' +
        '<div class="closet-item-thumb">' + thumbIcon + "</div>" +
        '<div class="closet-item-name">' + escapeHtml(c.name) + "</div>" +
        '<div class="closet-item-meta">' + escapeHtml(c.brand || "") + (price ? " · " + price : "") + " · " + escapeHtml(c.season || "") + "</div>" +
        (tagsHtml ? '<div class="closet-item-tags">' + tagsHtml + "</div>" : "") +
        '<button type="button" class="closet-item-del" data-id="' + escapeHtml(c.id) + '">Remove</button></div>";
    }).join("");
    grid.querySelectorAll(".closet-item-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = this.getAttribute("data-id");
        closetStore.set(closetStore.get().filter(function (c) { return c.id !== id; }));
        renderCloset();
        renderOutfitPicker();
        renderOutfitList();
        renderOnePieceOptions();
      });
    });
  }

  var closetFormEl = document.getElementById("closetForm");
  if (closetFormEl) closetFormEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var form = this;
    var name = (form.name && form.name.value || "").trim();
    if (!name) return;
    var item = {
      id: Date.now().toString(),
      name: name,
      brand: (form.brand && form.brand.value || "").trim(),
      category: (form.category && form.category.value) || "Tops",
      season: (form.season && form.season.value) || "All-year",
      styleTags: (form.styleTags && form.styleTags.value || "").trim(),
      price: form.price && form.price.value ? parseInt(form.price.value, 10) : null,
      link: (form.link && form.link.value || "").trim() || null,
      dupeNote: (form.dupeNote && form.dupeNote.value || "").trim() || null,
    };
    var list = closetStore.get();
    list.push(item);
    closetStore.set(list);
    form.reset();
    renderCloset();
    renderOutfitPicker();
    renderOnePieceOptions();
  });

  var filterCat = document.getElementById("filterCategory");
  var filterSea = document.getElementById("filterSeason");
  if (filterCat) filterCat.addEventListener("change", renderCloset);
  if (filterSea) filterSea.addEventListener("change", renderCloset);

  var outfitStore = storage("outfits");

  function renderOutfitPicker() {
    var list = closetStore.get();
    var container = document.getElementById("outfitPicker");
    if (!container) return;
    container.innerHTML = list.map(function (c) {
      return '<label><input type="checkbox" name="outfitItems" value="' + escapeHtml(c.id) + '" /> ' + escapeHtml(c.name) + " (" + escapeHtml(c.category || "") + ")</label>";
    }).join("");
  }

  function renderOutfitList() {
    var list = outfitStore.get();
    var container = document.getElementById("outfitList");
    var empty = document.getElementById("outfitEmpty");
    if (!container) return;
    if (list.length === 0) {
      container.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";
    var closet = closetStore.get();
    var idToName = {};
    closet.forEach(function (c) { idToName[c.id] = c.name; });
    container.innerHTML = list.map(function (o) {
      var names = (o.itemIds || []).map(function (id) { return idToName[id] || id; });
      return '<div class="outfit-card">' +
        '<div class="outfit-card-name">' + escapeHtml(o.name) + "</div>" +
        '<div class="outfit-card-meta">' + escapeHtml(o.occasion || "") + " · " + escapeHtml(o.weather || "") + (o.mood ? " · " + escapeHtml(o.mood) : "") + "</div>" +
        '<div class="outfit-card-items">' + (names.length ? names.join(", ") : "—") + "</div></div>";
    }).join("");
  }

  var outfitFormEl = document.getElementById("outfitForm");
  if (outfitFormEl) outfitFormEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = (document.getElementById("outfitName") && document.getElementById("outfitName").value || "").trim();
    if (!name) return;
    var checked = document.querySelectorAll('input[name="outfitItems"]:checked');
    var itemIds = [].map.call(checked, function (c) { return c.value; });
    var outfit = {
      id: Date.now().toString(),
      name: name,
      occasion: document.getElementById("outfitOccasion") && document.getElementById("outfitOccasion").value,
      weather: document.getElementById("outfitWeather") && document.getElementById("outfitWeather").value,
      mood: (document.getElementById("outfitMood") && document.getElementById("outfitMood").value || "").trim(),
      itemIds: itemIds,
    };
    outfitStore.set(outfitStore.get().concat(outfit));
    document.getElementById("outfitName").value = "";
    document.getElementById("outfitMood").value = "";
    document.querySelectorAll('input[name="outfitItems"]').forEach(function (c) { c.checked = false; });
    renderOutfitList();
  });

  function renderOnePieceOptions() {
    var list = closetStore.get();
    var select = document.getElementById("onePieceSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Choose a piece…</option>' + list.map(function (c) {
      return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + " · " + escapeHtml(c.category || "") + "</option>";
    }).join("");
  }

  function updateOnePieceSuggestions() {
    var id = document.getElementById("onePieceSelect") && document.getElementById("onePieceSelect").value;
    var suggestions = document.getElementById("onePieceSuggestions");
    if (!suggestions) return;
    if (!id) { suggestions.textContent = ""; return; }
    var list = closetStore.get();
    var item = list.find(function (c) { return c.id === id; });
    if (!item) return;
    var matches = list.filter(function (c) {
      return c.id !== id && (c.season === item.season || c.category !== item.category);
    });
    var tips = "Pair with pieces from other categories (e.g. top + bottom) and similar season. ";
    if (matches.length) tips += "Try: " + matches.slice(0, 5).map(function (m) { return m.name; }).join(", ");
    suggestions.textContent = tips;
  }

  var onePieceSelect = document.getElementById("onePieceSelect");
  if (onePieceSelect) onePieceSelect.addEventListener("change", updateOnePieceSuggestions);

  var outfitPrompts = document.getElementById("outfitPrompts");
  if (outfitPrompts) {
    var promptMap = {
      today: { name: "Today’s look", occasion: "Class" },
      onepiece: { name: "Built around one piece", occasion: "Other" },
      campus: { name: "Campus look", occasion: "Class" },
      interview: { name: "Interview ready", occasion: "Interview" },
      weekend: { name: "Weekend reset", occasion: "Other" },
    };
    outfitPrompts.querySelectorAll("[data-prompt]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var key = this.getAttribute("data-prompt");
        var p = promptMap[key];
        if (!p) return;
        var nameEl = document.getElementById("outfitName");
        var occasionEl = document.getElementById("outfitOccasion");
        if (nameEl) nameEl.placeholder = p.name;
        if (occasionEl) occasionEl.value = p.occasion;
      });
    });
  }

  renderCloset();
  renderOutfitPicker();
  renderOutfitList();
  renderOnePieceOptions();

  var eventStore = storage("events");
  var reflectionStore = storage("reflections");
  var sportStore = storage("sport");
  var sleepStore = storage("sleep");
  var calYear = new Date().getFullYear();
  var calMonth = new Date().getMonth();
  var selectedDate = null;

  function reflectionKey(date) {
    var o = reflectionStore.get();
    return typeof o === "object" && o[date] != null ? o[date] : "";
  }

  function setReflection(date, text) {
    var o = reflectionStore.get();
    if (typeof o !== "object") o = {};
    o[date] = text;
    reflectionStore.set(o);
  }

  function renderCal() {
    var titleEl = document.getElementById("calTitle");
    if (titleEl) titleEl.textContent = MONTH_NAMES[calMonth] + " " + calYear;
    var wEl = document.getElementById("calWeekdays");
    if (wEl) wEl.innerHTML = WEEKDAYS.map(function (w) { return '<div class="cal-weekday">' + w + "</div>"; }).join("");
    var first = new Date(calYear, calMonth, 1);
    var last = new Date(calYear, calMonth + 1, 0);
    var startDay = first.getDay();
    var days = last.getDate();
    var prevMonth = new Date(calYear, calMonth, 0);
    var prevDays = prevMonth.getDate();
    var events = eventStore.get();
    var today = todayStr();
    var html = "";
    var i, d, dateStr, hasEv, cls;
    for (i = 0; i < startDay; i++) {
      d = prevDays - startDay + i + 1;
      dateStr = prevMonth.getFullYear() + "-" + String(prevMonth.getMonth() + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      html += '<div class="cal-day other-month" data-date="' + dateStr + '">' + d + "</div>";
    }
    for (d = 1; d <= days; d++) {
      dateStr = calYear + "-" + String(calMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      hasEv = events.some(function (e) { return e.date === dateStr; });
      cls = "cal-day";
      if (dateStr === today) cls += " today";
      if (hasEv) cls += " has-events";
      html += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + "</div>";
    }
    var nextY = calMonth === 11 ? calYear + 1 : calYear;
    var nextM = calMonth === 11 ? 0 : calMonth + 1;
    var total = startDay + days;
    var nextCount = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (i = 0; i < nextCount; i++) {
      d = i + 1;
      dateStr = nextY + "-" + String(nextM + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      html += '<div class="cal-day other-month" data-date="' + dateStr + '">' + d + "</div>";
    }
    var daysEl = document.getElementById("calDays");
    if (daysEl) daysEl.innerHTML = html;
    daysEl.querySelectorAll(".cal-day").forEach(function (el) {
      el.addEventListener("click", function () {
        selectedDate = this.getAttribute("data-date");
        showDayDetail(selectedDate);
      });
    });
  }

  function showDayDetail(dateStr) {
    var box = document.getElementById("dayDetail");
    var titleEl = document.getElementById("dayDetailTitle");
    var listEl = document.getElementById("dayEventsList");
    if (!box || !titleEl || !listEl) return;
    box.style.display = "block";
    var parts = dateStr.split("-");
    var monthIdx = parseInt(parts[1], 10) - 1;
    titleEl.textContent = MONTH_NAMES[monthIdx] + " " + parseInt(parts[2], 10);
    var events = eventStore.get().filter(function (e) { return e.date === dateStr; }).sort(function (a, b) { return (a.time || "").localeCompare(b.time || ""); });
    listEl.innerHTML = events.length
      ? events.map(function (ev) { return '<div class="day-event"><span>' + (ev.time || "") + "</span> " + escapeHtml(ev.title || "") + "</div>"; }).join("")
      : '<p class="hint">Nothing scheduled yet. Add something above.</p>';
    document.getElementById("addEventForm").dataset.date = dateStr;
    var refEl = document.getElementById("dayReflection");
    if (refEl) refEl.value = reflectionKey(dateStr);
  }

  var addEventFormEl = document.getElementById("addEventForm");
  if (addEventFormEl) addEventFormEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var date = this.dataset.date;
    if (!date) return;
    var time = document.getElementById("evTime").value;
    var title = (document.getElementById("evTitle").value || "").trim();
    var type = document.getElementById("evType").value;
    if (!title) return;
    var list = eventStore.get();
    list.push({ id: Date.now().toString(), date: date, time: time, title: title, type: type });
    eventStore.set(list);
    showDayDetail(date);
    renderCal();
  });

  var saveReflEl = document.getElementById("saveReflection");
  if (saveReflEl) saveReflEl.addEventListener("click", function () {
    if (!selectedDate) return;
    var text = (document.getElementById("dayReflection") && document.getElementById("dayReflection").value || "").trim();
    setReflection(selectedDate, text);
  });

  var calPrevEl = document.getElementById("calPrev");
  var calNextEl = document.getElementById("calNext");
  if (calPrevEl) calPrevEl.addEventListener("click", function () {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCal();
  });
  if (calNextEl) calNextEl.addEventListener("click", function () {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCal();
  });

  var sportFormEl = document.getElementById("sportForm");
  if (sportFormEl) sportFormEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var type = document.getElementById("sportType").value;
    var duration = parseInt(document.getElementById("sportDuration").value, 10) || 0;
    var date = document.getElementById("sportDate").value;
    if (!date || duration <= 0) return;
    sportStore.set(sportStore.get().concat({ id: Date.now().toString(), type: type, duration: duration, date: date }));
    document.getElementById("sportDuration").value = "";
    document.getElementById("sportDate").value = todayStr();
    renderSportList();
    renderDashboardSummary();
  });

  function renderSportList() {
    var list = sportStore.get().slice().reverse().slice(0, 20);
    var el = document.getElementById("sportList");
    if (!el) return;
    el.innerHTML = list.length
      ? list.map(function (s) { return "<li>" + s.type + " " + (s.duration || 0) + " min · " + s.date + "</li>"; }).join("")
      : '<li class="hint">No sessions yet. Log one above.</li>';
  }

  var sleepFormEl = document.getElementById("sleepForm");
  if (sleepFormEl) sleepFormEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var start = document.getElementById("sleepStart").value;
    var end = document.getElementById("sleepEnd").value;
    var date = document.getElementById("sleepDate").value;
    if (!start || !end || !date) return;
    var s = start.split(":").map(Number);
    var e2 = end.split(":").map(Number);
    var mins = (e2[0] * 60 + e2[1]) - (s[0] * 60 + s[1]);
    if (mins <= 0) mins += 24 * 60;
    var hours = (mins / 60).toFixed(1);
    sleepStore.set(sleepStore.get().concat({ id: Date.now().toString(), date: date, start: start, end: end, hours: hours }));
    document.getElementById("sleepStart").value = "";
    document.getElementById("sleepEnd").value = "";
    document.getElementById("sleepDate").value = todayStr();
    renderSleepList();
    renderDashboardSummary();
  });

  function renderSleepList() {
    var list = sleepStore.get().slice().reverse().slice(0, 14);
    var el = document.getElementById("sleepList");
    if (!el) return;
    el.innerHTML = list.length
      ? list.map(function (s) { return "<li>" + s.start + " → " + s.end + " · " + s.hours + " hrs · " + s.date + "</li>"; }).join("")
      : '<li class="hint">No entries yet. Log last night above.</li>';
  }

  var sportDateEl = document.getElementById("sportDate");
  var sleepDateEl = document.getElementById("sleepDate");
  if (sportDateEl) sportDateEl.value = todayStr();
  if (sleepDateEl) sleepDateEl.value = todayStr();
  renderCal();
  renderSportList();
  renderSleepList();

  var overlay = document.getElementById("roomOverlay");
  var scene = document.getElementById("roomScene");
  var roomNameEl = document.getElementById("roomName");
  var roomGuidanceEl = document.getElementById("roomGuidance");
  var roomTimerEl = document.getElementById("roomTimer");

  function openRoom(roomId) {
    var name = ROOM_NAMES[roomId] || roomId;
    var guidance = ROOM_GUIDANCE[roomId] || "";
    var inner = scene.querySelector(".room-inner");
    if (inner) inner.remove();
    var div = document.createElement("div");
    div.className = "room-inner room-" + roomId;
    scene.insertBefore(div, scene.firstChild);
    if (roomNameEl) roomNameEl.textContent = name;
    if (scene) scene.setAttribute("data-room", roomId);
    if (roomGuidanceEl) {
      roomGuidanceEl.textContent = guidance;
      roomGuidanceEl.style.display = guidance ? "block" : "none";
      roomGuidanceEl.className = "room-guidance" + (roomId === "sleep" ? " room-guidance-dark" : "");
    }
    if (roomTimerEl) roomTimerEl.style.display = "none";
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  }

  document.querySelectorAll(".room-card").forEach(function (btn) {
    btn.addEventListener("click", function () { openRoom(this.getAttribute("data-room")); });
  });

  var roomCloseEl = document.getElementById("roomClose");
  if (roomCloseEl) roomCloseEl.addEventListener("click", function () {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  });
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) { overlay.classList.remove("show"); overlay.setAttribute("aria-hidden", "true"); }
  });
})();
