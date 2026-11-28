const API_BASE = "/api";

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3200);
}

function openReportModal() { document.getElementById("reportModal").classList.remove("hidden"); }
function closeReportModal() { document.getElementById("reportModal").classList.add("hidden"); }

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    document.getElementById("statTotalIssues").textContent = data.total_issues;
    document.getElementById("statResolutionRate").textContent = `${data.resolution_rate}%`;
    document.getElementById("statBudgetUtilized").textContent = `₹${data.utilized_budget_lakhs}L`;
    document.getElementById("statVolunteers").textContent = data.active_volunteers;
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

async function loadIssues() {
  const category = document.getElementById("filterCategory").value;
  const status = document.getElementById("filterStatus").value;
  const params = new URLSearchParams();
  if (category !== "All") params.append("category", category);
  if (status !== "All") params.append("status", status);

  try {
    const res = await fetch(`${API_BASE}/issues?${params.toString()}`);
    const issues = await res.json();
    const grid = document.getElementById("issuesGrid");

    if (!issues.length) {
      grid.innerHTML = `<p style="color:#475569;">No civic issues match the current filter.</p>`;
      return;
    }

    grid.innerHTML = issues.map(issue => `
      <article class="issue-card">
        <div>
          <div class="card-top">
            <span class="ticket-code">${issue.ticket_code} • ${issue.category}</span>
            <span class="badge sev-${issue.severity}">${issue.severity}</span>
          </div>
          <h3>${escapeHtml(issue.title)}</h3>
          <div class="issue-meta">📍 ${escapeHtml(issue.location_text)} • <strong>${escapeHtml(issue.ward)}</strong></div>
          ${issue.ai_detected_tag ? `<div class="ai-chip">🤖 ${escapeHtml(issue.ai_detected_tag)}</div>` : ""}
          ${issue.image_data ? `<img src="${issue.image_data}" alt="Civic issue evidence" class="issue-preview-img" />` : ""}
          <p class="issue-desc">${escapeHtml(issue.description)}</p>
        </div>

        <div>
          <div style="font-size:0.78rem; color:#64748B; margin-bottom:10px;">
            Est. Repair Allocation: <strong>₹${issue.estimated_budget_inr.toLocaleString("en-IN")}</strong> • Reported by ${escapeHtml(issue.reporter_name)}
          </div>
          <div class="card-footer">
            <button class="upvote-btn" onclick="upvoteIssue(${issue.id})">
              ▲ Upvote (${issue.upvotes})
            </button>
            <select class="status-select" onchange="updateStatus(${issue.id}, this.value)">
              <option value="Reported" ${issue.status === "Reported" ? "selected" : ""}>Reported</option>
              <option value="Verified" ${issue.status === "Verified" ? "selected" : ""}>Verified</option>
              <option value="In Progress" ${issue.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option value="Resolved" ${issue.status === "Resolved" ? "selected" : ""}>Resolved</option>
            </select>
          </div>
        </div>
      </article>
    `).join("");
  } catch (err) {
    console.error("Failed to load issues:", err);
  }
}

async function loadWards() {
  try {
    const res = await fetch(`${API_BASE}/wards`);
    const wards = await res.json();
    const tbody = document.getElementById("wardTableBody");

    tbody.innerHTML = wards.map((w, idx) => {
      const pct = Math.min(100, Math.round((w.utilized_budget_lakhs / w.allocated_budget_lakhs) * 100));
      return `
        <tr>
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${escapeHtml(w.ward_name)}</strong></td>
          <td><span class="badge sev-Medium">${w.civic_score} / 100</span></td>
          <td>₹${w.allocated_budget_lakhs.toFixed(1)} Lakhs</td>
          <td>₹${w.utilized_budget_lakhs.toFixed(1)} Lakhs</td>
          <td>
            <div class="progress-wrap"><div class="progress-fill" style="width:${pct}%"></div></div>
            <strong>${pct}%</strong>
          </td>
          <td>${w.active_volunteers} citizens</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load wards:", err);
  }
}

async function loadDrives() {
  try {
    const res = await fetch(`${API_BASE}/drives`);
    const drives = await res.json();
    const grid = document.getElementById("drivesGrid");

    grid.innerHTML = drives.map(d => {
      const remaining = d.spots_total - d.spots_filled;
      return `
        <div class="drive-card">
          <span class="ticket-code">${escapeHtml(d.ward)}</span>
          <h3>${escapeHtml(d.title)}</h3>
          <p style="font-size:0.88rem; color:#475569; margin-bottom:10px;">🗓️ ${escapeHtml(d.drive_date)}</p>
          <p style="font-size:0.83rem; color:#64748B; margin-bottom:16px;">Hosted by ${escapeHtml(d.organizer)} • <strong>${remaining} spots left</strong> (${d.spots_filled}/${d.spots_total})</p>
          <button class="btn btn-primary" style="width:100%;" onclick="joinDrive(${d.id})" ${remaining <= 0 ? "disabled" : ""}>
            ${remaining > 0 ? "Join Volunteer Drive (+50 Civic Karma)" : "Drive Full"}
          </button>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load drives:", err);
  }
}

async function runAiTriage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => { document.getElementById("imageBase64").value = reader.result; };
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/ai-triage`, { method: "POST", body: formData });
    const data = await res.json();
    document.getElementById("issueCategory").value = data.suggested_category;
    document.getElementById("issueSeverity").value = data.suggested_severity;
    document.getElementById("aiDetectedTag").value = data.ai_tag;

    const banner = document.getElementById("aiTriageBanner");
    banner.textContent = `🤖 AI Vision Triage: ${data.ai_tag} • Auto-set to ${data.suggested_category} (${data.suggested_severity})`;
    banner.classList.remove("hidden");
  } catch (err) {
    console.error("AI triage failed:", err);
  }
}

async function submitIssue(event) {
  event.preventDefault();
  const payload = {
    title: document.getElementById("issueTitle").value,
    category: document.getElementById("issueCategory").value,
    severity: document.getElementById("issueSeverity").value,
    ward: document.getElementById("issueWard").value,
    location_text: document.getElementById("issueLocation").value,
    description: document.getElementById("issueDescription").value,
    reporter_name: document.getElementById("reporterName").value || "Citizen Contributor",
    ai_detected_tag: document.getElementById("aiDetectedTag").value || null,
    image_data: document.getElementById("imageBase64").value || null
  };

  try {
    const res = await fetch(`${API_BASE}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to submit report");

    document.getElementById("issueForm").reset();
    document.getElementById("aiTriageBanner").classList.add("hidden");
    document.getElementById("imageBase64").value = "";
    closeReportModal();
    showToast("✅ Civic issue logged to PostgreSQL & added to live feed!");
    await Promise.all([loadStats(), loadIssues()]);
  } catch (err) {
    showToast("❌ Error submitting issue. Check FastAPI backend connection.");
  }
}

async function upvoteIssue(issueId) {
  try {
    await fetch(`${API_BASE}/issues/${issueId}/upvote`, { method: "POST" });
    showToast("▲ Upvote recorded! Priority score updated.");
    loadIssues();
  } catch (err) {
    console.error(err);
  }
}

async function updateStatus(issueId, status) {
  try {
    await fetch(`${API_BASE}/issues/${issueId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    showToast(`🔄 Ticket status updated to "${status}"`);
    await Promise.all([loadStats(), loadIssues()]);
  } catch (err) {
    console.error(err);
  }
}

async function joinDrive(driveId) {
  try {
    const res = await fetch(`${API_BASE}/drives/${driveId}/join`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      showToast(`⚠️ ${err.detail}`);
      return;
    }
    showToast("🙌 Registered for volunteer drive! +50 Civic Karma added.");
    await Promise.all([loadStats(), loadDrives()]);
  } catch (err) {
    console.error(err);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  loadIssues();
  loadWards();
  loadDrives();
});
