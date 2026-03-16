/**
 * Luna — App logic (English): storage, dashboard, closet, outfits, planner, rooms
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
  };

  var MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var ROOM_NAMES = { reset: "Reset", study: "Study", sleep: "Sleep", yoga: "Yoga" };

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
    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
    var page = document.getElementById("page-" + id);
    if (page) page.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.remove("active");
      if (n.getAttribute("data-nav") === id) n.classList.add("active");
    });
  }

  document.querySelectorAll("[data-nav]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var link = e.target.closest && e.target.closest("[data-nav]");
      var id = link ? link.getAttribute("data-nav") : this.getAttribute("data-nav");
      if (id) showPage(id);
    });
  });

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
      else sleepEl.textContent = "No records";
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
    if (moveEl) moveEl.textContent = count + " sessions · " + mins + " min";
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
      return '<div class="closet-item" data-id="' + escapeHtml(c.id) + '">' +
        '<div class="closet-item-name">' + escapeHtml(c.name) + "</div>" +
        '<div class="closet-item-meta">' + escapeHtml(c.brand || "") + (price ? " · " + price : "") + " · " + escapeHtml(c.season || "") + "</div>" +
        (tagsHtml ? '<div class="closet-item-tags">' + tagsHtml + "</div>" : "") +
        '<button type="button" class="closet-item-del" data-id="' + escapeHtml(c.id) + '">Delete</button></div>";
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

  document.getElementById("closetForm").addEventListener("submit", function (e) {
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

  document.getElementById("filterCategory").addEventListener("change", renderCloset);
  document.getElementById("filterSeason").addEventListener("change", renderCloset);

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

  document.getElementById("outfitForm").addEventListener("submit", function (e) {
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
    select.innerHTML = '<option value="">Pick one item</option>' + list.map(function (c) {
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
    var tips = "Pair with: different categories (e.g. top + bottom), same season. ";
    if (matches.length) tips += "In your closet: " + matches.slice(0, 5).map(function (m) { return m.name; }).join(", ");
    suggestions.textContent = tips;
  }

  var onePieceSelect = document.getElementById("onePieceSelect");
  if (onePieceSelect) onePieceSelect.addEventListener("change", updateOnePieceSuggestions);

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
      : '<p class="hint">No events</p>';
    document.getElementById("addEventForm").dataset.date = dateStr;
    var refEl = document.getElementById("dayReflection");
    if (refEl) refEl.value = reflectionKey(dateStr);
  }

  document.getElementById("addEventForm").addEventListener("submit", function (e) {
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

  document.getElementById("saveReflection").addEventListener("click", function () {
    if (!selectedDate) return;
    var text = (document.getElementById("dayReflection") && document.getElementById("dayReflection").value || "").trim();
    setReflection(selectedDate, text);
  });

  document.getElementById("calPrev").addEventListener("click", function () {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCal();
  });
  document.getElementById("calNext").addEventListener("click", function () {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCal();
  });

  document.getElementById("sportForm").addEventListener("submit", function (e) {
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
      : '<li class="hint">No logs yet</li>';
  }

  document.getElementById("sleepForm").addEventListener("submit", function (e) {
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
      : '<li class="hint">No logs yet</li>';
  }

  document.getElementById("sportDate").value = todayStr();
  document.getElementById("sleepDate").value = todayStr();
  renderCal();
  renderSportList();
  renderSleepList();

  var overlay = document.getElementById("roomOverlay");
  var scene = document.getElementById("roomScene");
  var roomNameEl = document.getElementById("roomName");

  function openRoom(roomId) {
    var name = ROOM_NAMES[roomId] || roomId;
    var inner = scene.querySelector(".room-inner");
    if (inner) inner.remove();
    var div = document.createElement("div");
    div.className = "room-inner room-" + roomId;
    scene.insertBefore(div, scene.firstChild);
    if (roomNameEl) roomNameEl.textContent = name;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  }

  document.querySelectorAll(".room-card").forEach(function (btn) {
    btn.addEventListener("click", function () { openRoom(this.getAttribute("data-room")); });
  });

  document.getElementById("roomClose").addEventListener("click", function () {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  });
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) { overlay.classList.remove("show"); overlay.setAttribute("aria-hidden", "true"); }
  });
})();
