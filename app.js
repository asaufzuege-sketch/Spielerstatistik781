// app.js (Teil 1 von 4)
// DOMContentLoaded - Initial Setup, DOM-Refs, Data, Sticky Header, Player Selection render + confirm

document.addEventListener("DOMContentLoaded", () => {
  // --- Elements ---
  const pages = {
    selection: document.getElementById("playerSelectionPage"),
    stats: document.getElementById("statsPage"),
    torbild: document.getElementById("torbildPage"),
    season: document.getElementById("seasonPage")
  };
  const playerListContainer = document.getElementById("playerList");
  const confirmSelectionBtn = document.getElementById("confirmSelection");
  const statsContainer = document.getElementById("statsContainer");
  const torbildBtn = document.getElementById("torbildBtn");
  const backToStatsBtn = document.getElementById("backToStatsBtn");
  const timerBtn = document.getElementById("timerBtn");
  const selectPlayersBtn = document.getElementById("selectPlayersBtn");
  const exportBtn = document.getElementById("exportBtn");
  const resetBtn = document.getElementById("resetBtn");
  const seasonBtn = document.getElementById("seasonBtn");
  const backToStatsFromSeasonBtn = document.getElementById("backToStatsFromSeasonBtn");
  const seasonContainer = document.getElementById("seasonContainer");
  const imageBoxes = document.querySelectorAll(".field-box, .goal-img-box");
  const statsScrollContainer = document.getElementById("statsScrollContainer");
  const stickyHeader = document.getElementById("stickyHeader");

  // --- Dark/Light Mode automatisch setzen ---
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  // --- Data ---
  const players = [
    { num: 4, name: "Ondrej Kastner" }, { num: 5, name: "Raphael Oehninger" },
    { num: 6, name: "Nuno Meier" }, { num: 7, name: "Silas Teuber" },
    { num: 8, name: "Diego Warth" }, { num: 9, name: "Mattia Crameri" },
    { num: 10, name: "Mael Bernath" }, { num: 11, name: "Sean Nef" },
    { num: 12, name: "Rafael Burri" }, { num: 13, name: "Lenny Schwarz" },
    { num: 14, name: "David Lienert" }, { num: 15, name: "Neven Severini" },
    { num: 16, name: "Nils Koubek" }, { num: 17, name: "Lionel Kundert" },
    { num: 18, name: "Livio Berner" }, { num: 19, name: "Robin Strasser" },
    { num: 21, name: "Marlon Kreyenbühl" }, { num: 22, name: "Martin Lana" },
    { num: 23, name: "Manuel Isler" }, { num: 24, name: "Moris Hürlimann" },
    { num: "", name: "Levi Baumann" }, { num: "", name: "Corsin Blapp" },
    { num: "", name: "Lenny Zimmermann" }, { num: "", name: "Luke Böhmichen" },
    { num: "", name: "Livio Weissen" }, { num: "", name: "Raul Wütrich" },
    { num: "", name: "Marco Senn" }
  ];

const categories = ["Shot", "Goals", "Assist", "+/-", "FaceOffs", "FaceOffs Won", "Penaltys"];

  // persistent state
  let selectedPlayers = JSON.parse(localStorage.getItem("selectedPlayers")) || [];
  let statsData = JSON.parse(localStorage.getItem("statsData")) || {};
  let playerTimes = JSON.parse(localStorage.getItem("playerTimes")) || {};
  let activeTimers = {}; // playerName -> intervalId
  let timerSeconds = Number(localStorage.getItem("timerSeconds")) || 0;
  let timerInterval = null;
  let timerRunning = false;

  // --- Sticky header helper ---
  function updateStickyHeaderHeight() {
    const h = stickyHeader ? stickyHeader.offsetHeight : 56;
    document.documentElement.style.setProperty("--sticky-header-height", `${h}px`);
  }
  updateStickyHeaderHeight();
  window.addEventListener("resize", updateStickyHeaderHeight);

  // --- Render player selection ---
  function renderPlayerSelection() {
    if (!playerListContainer) {
      console.error("playerList container not found");
      return;
    }
    playerListContainer.innerHTML = "";

    players.slice()
      .sort((a,b) => {
        const na = Number(a.num) || 999;
        const nb = Number(b.num) || 999;
        return na - nb;
      })
      .forEach(p => {
        const li = document.createElement("li");
        const checked = selectedPlayers.find(sp => sp.name === p.name) ? "checked" : "";
        // LABEL is a flex row: checkbox, number, name -> keeps them inline and reduces box height
        li.innerHTML = `
          <label class="player-line" style="display:flex;align-items:center;gap:8px;width:100%;">
            <input type="checkbox" value="${p.num}|${p.name}" ${checked} style="flex:0 0 auto">
            <div class="num" style="flex:0 0 48px;text-align:center;"><strong>${p.num || "-"}</strong></div>
            <div class="name" style="flex:1;color:#eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><strong>${p.name}</strong></div>
          </label>`;
        playerListContainer.appendChild(li);
      });

    // two custom lines for user-defined players
    const customSelected = selectedPlayers.filter(sp => !players.some(bp => bp.name === sp.name));
    for (let i = 0; i < 2; i++) {
      const pre = customSelected[i];
      const li = document.createElement("li");
      // custom label also flexed so inputs sit inline
      li.innerHTML = `
        <label class="custom-line" style="display:flex;align-items:center;gap:8px;width:100%;">
          <input type="checkbox" class="custom-checkbox" ${pre ? "checked" : ""} style="flex:0 0 auto">
          <input type="text" class="custom-num" inputmode="numeric" maxlength="3" placeholder="Nr." value="${pre?.num || ""}" style="width:56px;flex:0 0 auto;text-align:center;">
          <input type="text" class="custom-name" placeholder="Eigener Spielername" value="${pre?.name || ""}" style="flex:1;min-width:0;">
        </label>`;
      playerListContainer.appendChild(li);
    }
  }

  // --- Confirm selection handler ---
  confirmSelectionBtn.addEventListener("click", () => {
    selectedPlayers = Array.from(playerListContainer.querySelectorAll("input[type='checkbox']:not(.custom-checkbox)"))
      .filter(chk => chk.checked)
      .map(chk => {
        const [num, name] = chk.value.split("|");
        return { num, name };
      });

    // handle custom
    const allLis = Array.from(playerListContainer.querySelectorAll("li"));
    const customLis = allLis.slice(players.length);
    customLis.forEach(li => {
      const chk = li.querySelector(".custom-checkbox");
      const numInput = li.querySelector(".custom-num");
      const nameInput = li.querySelector(".custom-name");
      if (chk && chk.checked && nameInput && nameInput.value.trim() !== "") {
        selectedPlayers.push({ num: numInput.value.trim(), name: nameInput.value.trim() });
      }
    });

    localStorage.setItem("selectedPlayers", JSON.stringify(selectedPlayers));

    // ensure statsData exists for selected players
    selectedPlayers.forEach(p => {
      if (!statsData[p.name]) statsData[p.name] = {};
      categories.forEach(c => { if (statsData[p.name][c] === undefined) statsData[p.name][c] = 0; });
    });
    localStorage.setItem("statsData", JSON.stringify(statsData));

    showPage("stats");
    renderStatsTable();
  });

  // expose renderPlayerSelection to rest of file
  // (note: defined inside DOMContentLoaded scope)
  window.__renderPlayerSelection = renderPlayerSelection;
// --- PART 2/4 ---
// app.js (Teil 2 von 4)
// Stats rendering, ice-time colors, changeValue, totals, timer functions, CSV, reset

  // --- Eiszeitfarben dynamisch setzen ---
  function updateIceTimeColors() {
    const iceTimes = selectedPlayers.map(p => ({ name: p.name, seconds: playerTimes[p.name] || 0 }));
    const sortedDesc = iceTimes.slice().sort((a,b) => b.seconds - a.seconds);
    const top5 = new Set(sortedDesc.slice(0,5).map(x => x.name));
    const sortedAsc = iceTimes.slice().sort((a,b) => a.seconds - b.seconds);
    const bottom5 = new Set(sortedAsc.slice(0,5).map(x => x.name));

    if (!statsContainer) return;
    statsContainer.querySelectorAll(".ice-time-cell").forEach(cell => {
      const player = cell.dataset.player;
      if (top5.has(player)) cell.style.color = getComputedStyle(document.documentElement).getPropertyValue('--ice-top')?.trim() || "#00c06f";
      else if (bottom5.has(player)) cell.style.color = getComputedStyle(document.documentElement).getPropertyValue('--ice-bottom')?.trim() || "#ff4c4c";
      else cell.style.color = getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff";
    });
  }

  // --- Render stats table ---
  function renderStatsTable() {
    if (!statsContainer) return;
    statsContainer.innerHTML = "";

    const table = document.createElement("table");
    table.className = "stats-table";

    // thead
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>#</th><th>Spieler</th>` + categories.map(c => `<th>${c}</th>`).join("") + `<th>Time</th>`;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");
    selectedPlayers.forEach((p, idx) => {
      const tr = document.createElement("tr");
      tr.classList.add(idx % 2 === 0 ? "even-row" : "odd-row");

      // number & name
      const numTd = document.createElement("td");
      numTd.innerHTML = `<strong>${p.num || "-"}</strong>`;
      tr.appendChild(numTd);

      const nameTd = document.createElement("td");
      nameTd.style.cssText = "text-align:left;padding-left:12px;cursor:pointer;";
      nameTd.innerHTML = `<strong>${p.name}</strong>`;
      tr.appendChild(nameTd);

      // categories
      categories.forEach(c => {
        const td = document.createElement("td");
        const val = statsData[p.name]?.[c] ?? 0;
        const posColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-pos-color')?.trim() || "#00ff80";
        const negColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-neg-color')?.trim() || "#ff4c4c";
        const zeroColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff";
        const color = val > 0 ? posColor : val < 0 ? negColor : zeroColor;
        td.dataset.player = p.name;
        td.dataset.cat = c;
        td.style.color = color;
        td.textContent = val;
        tr.appendChild(td);
      });

      // ice time
      const iceTd = document.createElement("td");
      iceTd.className = "ice-time-cell";
      iceTd.dataset.player = p.name;
      const seconds = playerTimes[p.name] || 0;
      const m = String(Math.floor(seconds / 60)).padStart(2,"0");
      const s = String(seconds % 60).padStart(2,"0");
      iceTd.textContent = `${m}:${s}`;
      tr.appendChild(iceTd);

      tbody.appendChild(tr);
    });

    // totals row
    const totalsRow = document.createElement("tr");
    totalsRow.id = "totalsRow";
    const tdEmpty = document.createElement("td"); tdEmpty.textContent = "";
    const tdTotalLabel = document.createElement("td"); tdTotalLabel.textContent = `Total (${selectedPlayers.length})`;
    totalsRow.appendChild(tdEmpty);
    totalsRow.appendChild(tdTotalLabel);
    categories.forEach(c => {
      const td = document.createElement("td");
      td.className = "total-cell";
      td.dataset.cat = c;
      td.textContent = "0";
      totalsRow.appendChild(td);
    });
    tbody.appendChild(totalsRow);

    table.appendChild(tbody);
    statsContainer.appendChild(table);

    // attach click/dblclick to stat cells (CSP-safe: use closures, no string eval)
    statsContainer.querySelectorAll("td[data-player]").forEach(td => {
      let clickTimeout = null;
      td.addEventListener("click", (e) => {
        if (clickTimeout) clearTimeout(clickTimeout);
        // single click increments after short delay unless dblclick occurs
        clickTimeout = setTimeout(() => {
          changeValue(td, 1);
          clickTimeout = null;
        }, 200);
      });
      td.addEventListener("dblclick", (e) => {
        e.preventDefault();
        if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; }
        changeValue(td, -1);
      });
    });

    // start/stop per-player timers when clicking name
    statsContainer.querySelectorAll("td:nth-child(2)").forEach(td => {
      const playerName = td.textContent.trim();
      // set background if timer active
      if (activeTimers[playerName]) td.style.backgroundColor = "#005c2f";
      else td.style.backgroundColor = "";

      td.addEventListener("click", () => {
        if (activeTimers[playerName]) {
          clearInterval(activeTimers[playerName]);
          delete activeTimers[playerName];
          td.style.backgroundColor = "";
        } else {
          activeTimers[playerName] = setInterval(() => {
            playerTimes[playerName] = (playerTimes[playerName] || 0) + 1;
            localStorage.setItem("playerTimes", JSON.stringify(playerTimes));
            const sec = playerTimes[playerName];
            const mm = String(Math.floor(sec / 60)).padStart(2,"0");
            const ss = String(sec % 60).padStart(2,"0");
            const cell = statsContainer.querySelector(`.ice-time-cell[data-player="${playerName}"]`);
            if (cell) cell.textContent = `${mm}:${ss}`;
            updateIceTimeColors();
          }, 1000);
          td.style.backgroundColor = "#005c2f";
        }
      });
    });

    // after rendering update colors/totals
    updateIceTimeColors();
    updateTotals();
  }

  // --- change value helper ---
  function changeValue(td, delta) {
    const player = td.dataset.player;
    const cat = td.dataset.cat;
    if (!statsData[player]) statsData[player] = {};
    statsData[player][cat] = (statsData[player][cat] || 0) + delta;
    statsData[player][cat] = Math.trunc(statsData[player][cat]);
    localStorage.setItem("statsData", JSON.stringify(statsData));
    td.textContent = statsData[player][cat];

    // recolor cell
    const val = statsData[player][cat];
    const posColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-pos-color')?.trim() || "#00ff80";
    const negColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-neg-color')?.trim() || "#ff4c4c";
    const zeroColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff";
    td.style.color = val > 0 ? posColor : val < 0 ? negColor : zeroColor;

    updateTotals();
  }

  // --- update totals ---
  function updateTotals() {
    const totals = {};
    categories.forEach(c => totals[c] = 0);
    selectedPlayers.forEach(p => {
      categories.forEach(c => { totals[c] += (Number(statsData[p.name]?.[c]) || 0); });
    });

    document.querySelectorAll(".total-cell").forEach(tc => {
      const cat = tc.dataset.cat;
      if (cat === "+/-") {
        const vals = selectedPlayers.map(p => Number(statsData[p.name]?.[cat] || 0));
        const avg = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
        tc.textContent = `Ø ${avg}`;
        tc.style.color = "#ffffff";
      } else if (cat === "FaceOffs Won") {
        const totalFace = totals["FaceOffs"] || 0;
        const percent = totalFace ? Math.round((totals["FaceOffs Won"]/totalFace)*100) : 0;
        const percentColor = percent > 50 ? "#00ff80" : percent < 50 ? "#ff4c4c" : "#ffffff";
        tc.innerHTML = `<span style="color:white">${totals["FaceOffs Won"]}</span> (<span style="color:${percentColor}">${percent}%</span>)`;
      } else if (cat === "FaceOffs" || ["Goal","Assist","Penaltys"].includes(cat)) {
        tc.textContent = totals[cat] || 0;
        tc.style.color = "#ffffff";
      } else if (cat === "Shot") {
        if (!tc.dataset.opp) tc.dataset.opp = 0;
        const own = totals["Shot"] || 0;
        const opp = Number(tc.dataset.opp) || 0;
        let ownColor = "#ffffff", oppColor = "#ffffff";
        if (own > opp) { ownColor = "#00ff80"; oppColor = "#ff4c4c"; }
        else if (opp > own) { ownColor = "#ff4c4c"; oppColor = "#00ff80"; }
        tc.innerHTML = `<span style="color:${ownColor}">${own}</span> <span style="color:white">vs</span> <span style="color:${oppColor}">${opp}</span>`;
        tc.onclick = () => {
          tc.dataset.opp = Number(tc.dataset.opp || 0) + 1;
          updateTotals();
        };
      } else {
        tc.textContent = totals[cat] || 0;
        const posColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-pos-color')?.trim() || "#00ff80";
        const negColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-neg-color')?.trim() || "#ff4c4c";
        const zeroColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff";
        tc.style.color = totals[cat] > 0 ? posColor : totals[cat] < 0 ? negColor : zeroColor;
      }
    });
  }

  // --- timer helper functions ---
  function updateTimerDisplay(){
    const m = String(Math.floor(timerSeconds / 60)).padStart(2,"0");
    const s = String(timerSeconds % 60).padStart(2,"0");
    if (timerBtn) timerBtn.textContent = `${m}:${s}`;
    localStorage.setItem("timerSeconds", timerSeconds.toString());
  }
  function startTimer(){
    if (!timerInterval) {
      timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000);
      timerRunning = true;
      if (timerBtn) { timerBtn.classList.remove("stopped","reset"); timerBtn.classList.add("running"); }
    }
  }
  function stopTimer(){
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerRunning = false;
    if (timerBtn) { timerBtn.classList.remove("running","reset"); timerBtn.classList.add("stopped"); }
  }
  function resetTimerOnlyClock(){
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerSeconds = 0; timerRunning = false;
    updateTimerDisplay();
    if (timerBtn) { timerBtn.classList.remove("running","stopped"); timerBtn.classList.add("reset"); }
  }

  // timer long-press detection (CSP-safe)
  let holdTimer = null, longPress = false;
  const LONG_MS = 800;
  if (timerBtn) {
    timerBtn.addEventListener("mousedown", () => { longPress=false; holdTimer = setTimeout(()=>{ resetTimerOnlyClock(); longPress=true; }, LONG_MS); });
    timerBtn.addEventListener("mouseup", () => { if (holdTimer) clearTimeout(holdTimer); });
    timerBtn.addEventListener("mouseleave", () => { if (holdTimer) clearTimeout(holdTimer); });
    timerBtn.addEventListener("touchstart", () => { longPress=false; holdTimer = setTimeout(()=>{ resetTimerOnlyClock(); longPress=true; }, LONG_MS); }, {passive:true});
    timerBtn.addEventListener("touchend", () => { if (holdTimer) clearTimeout(holdTimer); });
    timerBtn.addEventListener("touchcancel", () => { if (holdTimer) clearTimeout(holdTimer); }, {passive:true});
    timerBtn.addEventListener("click", () => { if (longPress) { longPress=false; return; } if (timerInterval) stopTimer(); else startTimer(); });
  }

  // --- Reset (full) ---
  resetBtn.addEventListener("click", () => {
    const sicher = confirm("⚠️ Datenerfassung zurücksetzen?");
  if (!sicher) return;

  // Stats und Eiszeiten zurücksetzen
  selectedPlayers.forEach(p => {
    if (!statsData[p.name]) statsData[p.name] = {};
    categories.forEach(c => statsData[p.name][c] = 0);
    playerTimes[p.name] = 0;  // Eiszeiten zurücksetzen
  });

  // Speichern
  localStorage.setItem("statsData", JSON.stringify(statsData));
  localStorage.setItem("playerTimes", JSON.stringify(playerTimes));

  // Stats-Seite neu rendern
  renderStatsTable();
  updateIceTimeColors();
});
  // --- CSV Export ---
  exportBtn.addEventListener("click", () => {
    const rows = [["Spieler", ...categories, "Time"]];
    selectedPlayers.forEach(p => {
      const seconds = playerTimes[p.name] || 0;
      const m = String(Math.floor(seconds/60)).padStart(2,"0");
      const s = String(seconds%60).padStart(2,"0");
      const iceTimeStr = `${m}:${s}`;
      const row = [p.name, ...categories.map(c => statsData[p.name]?.[c] ?? 0), iceTimeStr];
      rows.push(row);
    });
    const totalsCells = document.querySelectorAll("#totalsRow .total-cell");
    const totalsRow = ["TOTAL"];
    totalsCells.forEach(cell => totalsRow.push(cell.innerText.replace(/\n/g, " ").trim()));
    rows.push(totalsRow);
    rows.push(["Timer", timerBtn ? timerBtn.textContent : "00:00"]);
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "spielerstatistik.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });
// --- PART 3/4 ---
// app.js (Teil 3 von 4)
// Marker logic, Torbild click/touch with single/double/long detection (no eval), clear markers

  // --- Marker helpers ---
  const LONG_MARK_MS = 600;

  function createMarkerPercent(xPct, yPct, color, container) {
    const dot = document.createElement("div");
    dot.className = "marker-dot";
    dot.style.backgroundColor = color;
    dot.style.left = `${xPct}%`;
    dot.style.top = `${yPct}%`;
    dot.addEventListener("click", (ev) => { ev.stopPropagation(); dot.remove(); });
    container.appendChild(dot);
  }

  function clearAllMarkers() {
    document.querySelectorAll(".marker-dot").forEach(d => d.remove());
  }

  // --- Marker handler for each image box ---
  imageBoxes.forEach(box => {
    const img = box.querySelector("img");
    if (!img) return;
    box.style.position = "relative";

    // We'll implement detection of:
    // - single click/tap -> place colored marker (green/top or red/bottom for field)
    // - double click/tap -> special (grey) marker (user asked double -> -1 in some contexts; here it's grey)
    // - long press -> grey marker
    // Implementation uses timestamps and timers (no string eval)

    let mouseHoldTimer = null;
    let isLong = false;
    let lastMouseUp = 0;
    let lastTouchEnd = 0;
    let touchStartTime = 0;

    function getPosFromEvent(e) {
      const rect = img.getBoundingClientRect();
      const clientX = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX);
      const clientY = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY);
      const xPct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100;
      const yPct = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)) * 100;
      return { xPct, yPct };
    }

    function createMarkerBasedOn(pos, boxEl, longPress, forceGrey=false) {
      // goal boxes always grey
      const id = boxEl.id;
      if (id === "goalGreenBox" || id === "goalRedBox" || longPress || forceGrey) {
        createMarkerPercent(pos.xPct, pos.yPct, "#444", boxEl);
        return;
      }
      // field box: top => green, bottom => red
      if (boxEl.classList.contains("field-box")) {
        const color = pos.yPct > 50 ? "#ff0000" : "#00ff66";
        createMarkerPercent(pos.xPct, pos.yPct, color, boxEl);
        return;
      }
      // fallback
      createMarkerPercent(pos.xPct, pos.yPct, "#444", boxEl);
    }

    // --- Mouse events ---
    img.addEventListener("mousedown", (ev) => {
      isLong = false;
      mouseHoldTimer = setTimeout(() => {
        isLong = true;
        const pos = getPosFromEvent(ev);
        createMarkerBasedOn(pos, box, true);
      }, LONG_MARK_MS);
    });

    img.addEventListener("mouseup", (ev) => {
      if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
      const now = Date.now();
      const pos = getPosFromEvent(ev);

      // detect double click (based on time difference)
      if (now - lastMouseUp < 300) {
        // double click -> grey marker
        createMarkerBasedOn(pos, box, true, true);
        lastMouseUp = 0;
      } else {
        // single click -> depending on whether longPress happened
        if (!isLong) createMarkerBasedOn(pos, box, false);
        lastMouseUp = now;
      }
      isLong = false;
    });

    img.addEventListener("mouseleave", () => {
      if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
      isLong = false;
    });

    // --- Touch events ---
    img.addEventListener("touchstart", (ev) => {
      isLong = false;
      touchStartTime = Date.now();
      if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
      mouseHoldTimer = setTimeout(() => {
        isLong = true;
        const pos = getPosFromEvent(ev.touches[0]);
        createMarkerBasedOn(pos, box, true);
      }, LONG_MARK_MS);
    }, { passive: true });

    img.addEventListener("touchend", (ev) => {
      if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
      const now = Date.now();
      const pos = getPosFromEvent(ev.changedTouches[0]);

      // double tap detection
      if (now - lastTouchEnd < 300) {
        // double tap -> grey marker
        createMarkerBasedOn(pos, box, true, true);
        lastTouchEnd = 0;
      } else {
        // single tap -> if not long press, place colored marker
        if (!isLong) createMarkerBasedOn(pos, box, false);
        lastTouchEnd = now;
      }
      // reset long flag after handling
      isLong = false;
    }, { passive: true });

    img.addEventListener("touchcancel", () => {
      if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
      isLong = false;
    }, { passive: true });
  });
// --- PART 4/4 ---
// app.js (Teil 4 von 4)
// Season table, time-tracking buttons at torbild page, final init and helpers

  // --- Season table rendering ---
function renderSeasonTable() {
  const container = document.getElementById("seasonContainer");
  if (!container) return;
  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = "stats-table";

  // Header-Zeile erzeugen
  const headerCols = [
    "Points", "MVP", "Nr", "Name", "Spieler", "Games", 
    "Goals", "Assists", "Points", "+/-", "Ø +/-",
    "Shots", "Shots/Game", "Goals/Game", "Points/Game",
    "Penalty", "Goal Value", "FaceOffs", "FaceOffs Won", "FaceOffs %", "Time"
  ];

  const headerRow = document.createElement("tr");
  headerCols.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Spielerzeilen
  players.forEach(player => {
    const stats = statsData[player.name] || {};
    const timeSeconds = playerTimes[player.name] || 0;
    const games = stats.Games || 1; // mindestens 1 Spiel
    const goals = stats.Goals || 0;
    const assists = stats.Assist || 0;
    const points = goals + assists;
    const plusMinus = stats["+/-"] || 0;
    const shots = stats.Shot || 0;
    const penalty = stats.Penaltys || 0;
    const faceOffs = stats.FaceOffs || 0;
    const faceOffsWon = stats["FaceOffs Won"] || 0;
    const faceOffPercent = faceOffs ? Math.round((faceOffsWon / faceOffs) * 100) : 0;
    const goalValue = shots ? Math.round((goals / shots) * 100) : 0;

    const mm = String(Math.floor(timeSeconds / 60)).padStart(2,"0");
    const ss = String(timeSeconds % 60).padStart(2,"0");
    const timeStr = `${mm}:${ss}`;

    const tr = document.createElement("tr");
    const cells = [
      points,           // Points
      "",               // MVP (leer)
      player.num || "", // Nr
      player.name,      // Name
      player.name,      // Spieler
      games,            // Games
      goals,            // Goals
      assists,          // Assists
      points,           // Points
      plusMinus,        // +/-
      Math.round(plusMinus / games), // Ø +/-
      shots,            // Shots
      (shots / games).toFixed(2),    // Shots/Game
      (goals / games).toFixed(2),    // Goals/Game
      (points / games).toFixed(2),   // Points/Game
      penalty,          // Penalty
      goalValue,        // Goal Value
      faceOffs,         // FaceOffs
      faceOffsWon,      // FaceOffs Won
      faceOffPercent + "%", // FaceOff %
      timeStr           // Time
    ];

    cells.forEach(c => {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  container.appendChild(table);
}  // --- Pages navigation helpers (already bound earlier but ensure correctness) ---
  function showPage(page) {
    Object.values(pages).forEach(p => { if (p) p.style.display = "none"; });
    if (pages[page]) pages[page].style.display = "block";
    localStorage.setItem("currentPage", page);
    setTimeout(updateStickyHeaderHeight, 50);
  }

  selectPlayersBtn.addEventListener("click", () => showPage("selection"));
  torbildBtn.addEventListener("click", () => showPage("torbild"));
  backToStatsBtn.addEventListener("click", () => showPage("stats"));
  backToStatsFromSeasonBtn.addEventListener("click", () => showPage("stats"));
  seasonBtn.addEventListener("click", () => { showPage("season"); renderSeasonTable(); });

  // --- Time tracking buttons in torbild (the grid of buttons) ---
  const timeTrackingBox = document.getElementById("timeTrackingBox");
  if (timeTrackingBox) {
    // read stored structure or empty object
    let timeData = JSON.parse(localStorage.getItem("timeData")) || {};

    timeTrackingBox.querySelectorAll(".period").forEach(period => {
      const periodNum = period.dataset.period || Math.random().toString(36).slice(2,6);
      const buttons = period.querySelectorAll(".time-btn");

      buttons.forEach((btn, idx) => {
        // initialize textual display from stored value or default to 0 (force 0 if no stored)
        const hasStored = (timeData[periodNum] && typeof timeData[periodNum][idx] !== "undefined");
        const stored = hasStored ? Number(timeData[periodNum][idx]) : 0;
        btn.textContent = stored;

        let lastTap = 0;
        let clickTimeout = null;
        let touchStart = 0;

        const updateValue = (delta) => {
          const current = Number(btn.textContent) || 0;
          const newVal = Math.max(0, current + delta);
          btn.textContent = newVal;
          if (!timeData[periodNum]) timeData[periodNum] = {};
          timeData[periodNum][idx] = newVal;
          localStorage.setItem("timeData", JSON.stringify(timeData));
        };
// --- Torbild Reset Button (nur Marker + Timeboxen) ---
const torbildResetBtn = document.getElementById("resetTorbildBtn");

if (torbildResetBtn) {
  torbildResetBtn.addEventListener("click", () => {
    const sicher = confirm("Goalmarkers zurücksetzen?");
    if (!sicher) return;

    // 🔹 1. Alle Marker-Punkte im Torbild entfernen
    document.querySelectorAll(".marker-dot").forEach(dot => dot.remove());

    // 🔹 2. Alle Zahlen in den Time-Buttons auf 0 setzen
    const timeButtons = document.querySelectorAll("#timeTrackingBox .time-btn");
    timeButtons.forEach(btn => btn.textContent = "0");

    // 🔹 3. (optional) gespeicherte Werte löschen
    localStorage.removeItem("goalMarkers");
    localStorage.removeItem("timeData");

    // 🔹 4. Meldung erst NACH dem visuellen Update zeigen
    setTimeout(() => {
      alert("Goalmarkers und Time-Buttons wurden zurückgesetzt.");
    }, 50);
  });
} }        // Desktop click with double-click detection -> double = -1, single = +1
        btn.addEventListener("click", () => {
          const now = Date.now();
          const diff = now - lastTap;
          if (diff < 300) {
            // double click -> -1
            if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; }
            updateValue(-1);
            lastTap = 0;
          } else {
            // single click -> +1 (delay to allow double click)
            clickTimeout = setTimeout(() => { updateValue(+1); clickTimeout = null; }, 300);
            lastTap = now;
          }
        });

        // touch handling (double tap logic)
        btn.addEventListener("touchstart", (e) => {
          const now = Date.now();
          const diff = now - touchStart;
          if (diff < 300) {
            // double tap
            e.preventDefault();
            if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; }
            updateValue(-1);
            touchStart = 0;
          } else {
            touchStart = now;
            // wait a little before single-tap increments, to allow double-tap
            setTimeout(() => {
              if (touchStart !== 0) {
                updateValue(+1);
                touchStart = 0;
              }
            }, 300);
          }
        }, { passive: true });
      });
    });
  }

  // --- Final init and restore state on load ---
  renderPlayerSelection();

  const lastPage = localStorage.getItem("currentPage") || (selectedPlayers.length ? "stats" : "selection");
  if (lastPage === "stats") {
    showPage("stats");
    renderStatsTable();
    updateIceTimeColors();
  } else {
    showPage("selection");
  }

  // initial timer display
  updateTimerDisplay();

  // Save statsData on page unload for safety (still CSP-friendly)
  window.addEventListener("beforeunload", () => {
    try {
      localStorage.setItem("statsData", JSON.stringify(statsData));
      localStorage.setItem("selectedPlayers", JSON.stringify(selectedPlayers));
      localStorage.setItem("playerTimes", JSON.stringify(playerTimes));
      localStorage.setItem("timerSeconds", String(timerSeconds));
    } catch (e) {
      // ignore storage errors
    }
  });

}); // end DOMContentLoaded
