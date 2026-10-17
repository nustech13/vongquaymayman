(() => {
  "use strict";

  const STORAGE_KEY = "lucky-wheel-items-v1";
  const DEFAULT_ITEMS = [
    { name: "Nhận quà bí mật", color: "#ff4f81" },
    { name: "Uống trà sữa", color: "#ff9f43" },
    { name: "Thưởng bản thân", color: "#ffd447" },
    { name: "Đi dạo 15 phút", color: "#43c985" },
    { name: "Ăn món yêu thích", color: "#26b8e8" },
    { name: "Được chọn phim", color: "#477bff" },
    { name: "Voucher 20%", color: "#a855f7" },
    { name: "Thử lại lần nữa", color: "#e65ad5" }
  ];
  const PALETTE = ["#ff4f81", "#ff9f43", "#ffd447", "#43c985", "#26b8e8", "#477bff", "#a855f7", "#e65ad5", "#ff6b55", "#2dd4bf"];
  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#wheelCanvas");
  const ctx = canvas.getContext("2d");
  const list = $("#itemsList");
  const spinBtn = $("#spinBtn");
  const spinLabel = $(".spin-label");
  const spinHint = $("#spinHint");
  const modal = $("#resultModal");
  const winnerName = $("#winnerName");
  const itemInput = $("#itemInput");
  const addForm = $("#addForm");
  let items = loadItems();
  let selectedColor = "#ff4f81";
  let rotation = 0;
  let spinning = false;
  let toastTimeout;

  function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }
  // Luôn tạo bản sao mới để thao tác thêm/sửa/xóa không làm thay đổi danh sách mẫu gốc.
  function createDefaultItems() {
    return DEFAULT_ITEMS.map(item => ({ ...item, id: makeId() }));
  }
  function loadItems() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) return saved.filter(x => x && typeof x.name === "string" && x.name.trim()).map(x => ({
        id: String(x.id || makeId()), name: x.name.trim().slice(0, 48),
        color: /^#[0-9a-f]{6}$/i.test(x.color) ? x.color : PALETTE[0]
      }));
    } catch (_) {}
    return createDefaultItems();
  }
  function saveItems() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch (_) { showToast("Không thể lưu tự động trên trình duyệt này."); }
  }
  function render() {
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-list";
      empty.textContent = "Chưa có lựa chọn nào. Hãy thêm ít nhất 2 lựa chọn để quay nhé!";
      list.append(empty);
    } else {
      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "item-row";
        const swatch = document.createElement("span");
        swatch.className = "item-swatch";
        swatch.style.setProperty("--item-color", item.color);
        const name = document.createElement("span");
        name.className = "item-name";
        name.textContent = item.name;
        name.title = item.name;
        const actions = document.createElement("div");
        actions.className = "item-actions";
        const edit = document.createElement("button");
        edit.className = "icon-button";
        edit.type = "button";
        edit.title = "Sửa lựa chọn";
        edit.setAttribute("aria-label", `Sửa ${item.name}`);
        edit.textContent = "✎";
        edit.addEventListener("click", () => editItem(item.id));
        const remove = document.createElement("button");
        remove.className = "icon-button delete";
        remove.type = "button";
        remove.title = "Xóa lựa chọn";
        remove.setAttribute("aria-label", `Xóa ${item.name}`);
        remove.textContent = "×";
        remove.addEventListener("click", () => removeItem(item.id));
        actions.append(edit, remove);
        row.append(swatch, name, actions);
        list.append(row);
      });
    }
    $("#itemCount").textContent = items.length;
    $("#countBadge").textContent = String(items.length).padStart(2, "0");
    spinBtn.disabled = spinning || items.length < 2;
    spinLabel.textContent = spinning ? "ĐANG QUAY..." : "QUAY NGAY";
    if (items.length < 2 && !spinning) spinHint.textContent = "Thêm ít nhất 2 lựa chọn để bắt đầu quay.";
    else if (!spinning) spinHint.textContent = "Nhấn vào vòng quay hoặc nút bên trên để bắt đầu · 10 giây";
    drawWheel();
  }

  function drawWheel() {
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2, radius = 414;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    // Outer metallic ring
    const ring = ctx.createRadialGradient(0, -radius + 5, radius * .7, 0, 0, radius + 14);
    ring.addColorStop(0, "#fff6c5");
    ring.addColorStop(.45, "#ffbf39");
    ring.addColorStop(.72, "#fff0a0");
    ring.addColorStop(1, "#b65b12");
    ctx.beginPath();
    ctx.arc(0, 0, radius + 13, 0, Math.PI * 2);
    ctx.fillStyle = ring;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffdf69";
    ctx.fill();
    if (items.length) {
      const arc = Math.PI * 2 / items.length;
      items.forEach((item, index) => {
        const start = rotation + index * arc - Math.PI / 2;
        const end = start + arc;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius - 5, start, end);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.78)";
        ctx.lineWidth = 3;
        ctx.stroke();

        const mid = start + arc / 2;
        ctx.save();
        ctx.rotate(mid);
        const textRadius = radius * (items.length > 12 ? .68 : .64);
        ctx.translate(textRadius, 0);
        ctx.rotate(Math.PI / 2);
        const maxChars = items.length > 14 ? 10 : items.length > 9 ? 13 : 17;
        const label = item.name.length > maxChars ? item.name.slice(0, maxChars - 1) + "…" : item.name;
        const fontSize = Math.max(19, Math.min(31, 330 / Math.max(items.length, 8)));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,.25)";
        ctx.shadowBlur = 5;
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${fontSize}px "DM Sans", Arial, sans-serif`;
        const words = wrapText(label, items.length > 10 ? 10 : 12);
        const lineHeight = fontSize * 1.12;
        words.slice(0, 3).forEach((line, lineIndex) => {
          ctx.fillText(line, 0, (lineIndex - (Math.min(words.length, 3) - 1) / 2) * lineHeight, radius * .35);
        });
        ctx.restore();
      });
    } else {
      ctx.fillStyle = "#33235e";
      ctx.beginPath();
      ctx.arc(0, 0, radius - 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e5d7ff";
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = "center";
      ctx.fillText("Thêm lựa chọn", 0, 0);
    }
    // Small bulbs around the rim
    const bulbCount = Math.max(32, Math.min(64, items.length * 5));
    for (let i = 0; i < bulbCount; i++) {
      const a = i * Math.PI * 2 / bulbCount - Math.PI / 2;
      const r = radius + 7;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#fff9d4";
      ctx.shadowColor = "#ffec86";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowBlur = 0;
      ctx.fill();
    }
    ctx.restore();
  }
  function wrapText(text, maxChars) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      if (!line) line = word;
      else if ((line + " " + word).length <= maxChars) line += " " + word;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [text];
  }

  function addItem(name, color) {
    const clean = name.trim();
    if (!clean) return;
    if (items.length >= 30) { showToast("Bạn có thể thêm tối đa 30 lựa chọn để vòng quay dễ đọc."); return; }
    if (clean.length > 48) { showToast("Tên lựa chọn tối đa 48 ký tự."); return; }
    items.push({ id: makeId(), name: clean, color: color || PALETTE[items.length % PALETTE.length] });
    saveItems();
    render();
    showToast(`Đã thêm “${clean}”`);
  }
  function editItem(id) {
    if (spinning) return;
    const item = items.find(x => x.id === id);
    if (!item) return;
    const next = window.prompt("Sửa tên lựa chọn:", item.name);
    if (next === null) return;
    const clean = next.trim();
    if (!clean) { showToast("Tên lựa chọn không được để trống."); return; }
    item.name = clean.slice(0, 48);
    saveItems();
    render();
    showToast("Đã cập nhật lựa chọn.");
  }
  function removeItem(id) {
    if (spinning) return;
    const item = items.find(x => x.id === id);
    if (!item) return;
    items = items.filter(x => x.id !== id);
    saveItems();
    render();
    showToast(`Đã xóa “${item.name}”`);
  }
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function openResult(item) {
    winnerName.textContent = item.name;
    modal.hidden = false;
    $("#closeModal").focus();
    launchConfetti();
  }
  function closeResult() {
    modal.hidden = true;
    spinBtn.focus();
  }
  function launchConfetti() {
    // Small celebratory burst using temporary DOM elements; no external library required.
    const colors = ["#ff4f81", "#ffd447", "#43c985", "#477bff", "#a855f7", "#ff9f43"];
    for (let i = 0; i < 55; i++) {
      const bit = document.createElement("span");
      bit.style.cssText = `position:fixed;z-index:25;left:${Math.random()*100}vw;top:-15px;width:${5+Math.random()*7}px;height:${7+Math.random()*10}px;background:${colors[i%colors.length]};border-radius:2px;pointer-events:none;`;
      document.body.append(bit);
      const x = (Math.random() - .5) * 260;
      const y = 450 + Math.random() * 450;
      const rotate = Math.random() * 900;
      bit.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${x}px,${y}px) rotate(${rotate}deg)`, opacity: 0 }
      ], { duration: 1800 + Math.random() * 1200, easing: "cubic-bezier(.15,.7,.25,1)" }).onfinish = () => bit.remove();
    }
  }

  // Lựa chọn có chứa các cụm từ này (sau khi đổi sang chữ thường) sẽ không bao giờ trúng.
  const EXCLUDED_PHRASES = ["thuận", "min", "500k"];
  function isExcluded(name) {
    const lower = name.normalize("NFC").toLowerCase();
    return EXCLUDED_PHRASES.some(phrase => lower.includes(phrase));
  }

  function spin() {
    if (spinning) return;
    if (items.length < 2) { showToast("Hãy thêm ít nhất 2 lựa chọn trước khi quay."); return; }
    spinning = true;
    render();
    const duration = 10000;
    const startRotation = rotation;
    const eligible = items.map((item, index) => index).filter(index => !isExcluded(items[index].name));
    // Nếu mọi lựa chọn đều bị loại thì vẫn cho quay trên toàn bộ danh sách.
    const pool = eligible.length ? eligible : items.map((item, index) => index);
    const winnerIndex = pool[Math.floor(Math.random() * pool.length)];
    const arc = Math.PI * 2 / items.length;
    // Pointer is at -90deg. Rotate so the selected segment's center ends at the pointer.
    const desiredMod = (-(winnerIndex * arc + arc / 2) + Math.PI * 2 * 4) % (Math.PI * 2);
    const currentMod = ((startRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = (desiredMod - currentMod + Math.PI * 2) % (Math.PI * 2);
    delta += (Math.PI * 2) * (7 + Math.floor(Math.random() * 3));
    const targetRotation = startRotation + delta;
    const startTime = performance.now();
    spinHint.textContent = "Vòng quay đang chuyển động... chờ kết quả nhé!";
    let lastTick = 0;
    function frame(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      // Ease-out quint: quick start, slow and satisfying finish.
      const eased = 1 - Math.pow(1 - progress, 5);
      rotation = startRotation + (targetRotation - startRotation) * eased;
      drawWheel();
      if (now - lastTick > 85) { lastTick = now; }
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        rotation = targetRotation;
        drawWheel();
        spinning = false;
        render();
        spinHint.textContent = "Đã có kết quả! Bạn có thể quay tiếp khi sẵn sàng.";
        openResult(items[winnerIndex]);
      }
    }
    requestAnimationFrame(frame);
  }

  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addItem(itemInput.value, selectedColor);
    itemInput.value = "";
    itemInput.focus();
  });
  $("#colorPicker").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-color]");
    if (!btn) return;
    selectedColor = btn.dataset.color;
    document.querySelectorAll(".color-dot").forEach(el => el.classList.toggle("selected", el === btn));
  });
  spinBtn.addEventListener("click", spin);
  canvas.addEventListener("click", spin);
  $("#clearBtn").addEventListener("click", () => {
    if (spinning) return;
    if (!items.length) { showToast("Danh sách đã trống."); return; }
    if (window.confirm("Bạn có chắc muốn xóa tất cả lựa chọn?")) {
      items = [];
      saveItems();
      render();
      showToast("Đã xóa tất cả lựa chọn.");
    }
  });
  $("#resetBtn").addEventListener("click", () => {
    if (spinning) return;
    if (window.confirm("Khôi phục danh sách mẫu? Danh sách hiện tại sẽ được thay thế.")) {
      items = createDefaultItems();
      saveItems();
      render();
      showToast("Đã khôi phục danh sách mẫu.");
    }
  });
  $("#closeModal").addEventListener("click", closeResult);
  $("#doneBtn").addEventListener("click", closeResult);
  $("#spinAgainBtn").addEventListener("click", () => { closeResult(); spin(); });
  modal.addEventListener("click", event => { if (event.target === modal) closeResult(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeResult();
    if ((event.key === "Enter" || event.key === " ") && document.activeElement === canvas) {
      event.preventDefault(); spin();
    }
  });

  render();
})();