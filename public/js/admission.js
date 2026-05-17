let currentSection = 1;
let selectedPM = "upi";
let feeAmount = 0;
const yearNames = ["—", "1st Year", "2nd Year", "3rd Year", "4th Year"];

function getFee(y) {
  if (!y) return 0;
  return parseInt(y) === 1 ? 6500 : 5000;
}

function updateFee() {
  const y = document.getElementById("yearStudy").value;
  const c = document.getElementById("course").value;
  feeAmount = getFee(y);

  // sidebar highlight
  ["feeRow1", "feeRow2", "feeRow3", "feeRow4"].forEach((id, i) => {
    document
      .getElementById(id)
      .classList.toggle(
        "highlighted",
        (i === 0 && y === "1") ||
          (i > 0 &&
            ["2", "3", "4", "5"].includes(y) &&
            i === Math.min(parseInt(y) - 1, 3)),
      );
  });

  if (y) {
    document.getElementById("feeHighlight").style.display = "block";
    document.getElementById("feeDisplay").textContent =
      "₹" + feeAmount.toLocaleString("en-IN");
    document.getElementById("feeNote").textContent =
      parseInt(y) === 1
        ? "First year admission rate"
        : "Continuing student rate";
    document.getElementById("payAmount").textContent =
      "₹ " + feeAmount.toLocaleString("en-IN");
    document.getElementById("payYear").textContent =
      yearNames[parseInt(y)] || "";

    const sumFee = document.getElementById("sum-fee");
    sumFee.textContent = "₹ " + feeAmount.toLocaleString("en-IN");
    sumFee.classList.remove("hidden");
  }

  // update summary
  if (c) document.getElementById("sum-course").textContent = c;
  if (y)
    document.getElementById("sum-year").textContent =
      yearNames[parseInt(y)] || y;
  updatePayApplicant();
}

function updatePayApplicant() {
  const fn = document.getElementById("firstName").value;
  const ln = document.getElementById("lastName").value;
  if (fn || ln)
    document.getElementById("payApplicant").textContent = (
      fn +
      " " +
      ln
    ).trim();
  const sess = document.getElementById("session").value || "2025–26";
  document.getElementById("paySess").textContent = sess;
  document.getElementById("sum-session").textContent = sess;
}

function updateSummary() {
  const fn = document.getElementById("firstName").value;
  const ln = document.getElementById("lastName").value;
  if (fn || ln)
    document.getElementById("sum-name").textContent = (fn + " " + ln).trim();
  const cat = document.getElementById("category").value;
  if (cat) document.getElementById("sum-cat").textContent = cat;
  updateFee();
}

// Section nav
function showSection(n) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("sec" + n).classList.add("active");
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById("step" + i);
    el.classList.remove("active", "done");
    if (i < n) el.classList.add("done");
    else if (i === n) el.classList.add("active");
  }
  currentSection = n;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goNext(from) {
  if (!validateSection(from)) return;
  updateSummary();
  showSection(from + 1);
}

function goBack(from) {
  showSection(from - 1);
}

// Validation
function validateSection(n) {
  let ok = true;
  if (n === 1) {
    ok &=
      req("firstName") &
      req("lastName") &
      req("dob") &
      req("gender") &
      req("category") &
      req("address");
  } else if (n === 2) {
    ok &= req("college") & req("course") & req("yearStudy") & req("session");
  } else if (n === 3) {
    ok &=
      req("mobile") &
      req("guardianName") &
      req("guardianMobile") &
      reqAadhar() &
      req("aadharName");
    if (document.getElementById("mobile").value.length !== 10) {
      showErr("mobile", "Enter valid 10-digit mobile");
      ok = false;
    }
    if (document.getElementById("guardianMobile").value.length !== 10) {
      showErr("guardianMobile", "Enter valid 10-digit mobile");
      ok = false;
    }
  } else if (n === 4) {
    // payment validation handled in submitForm
  }
  return !!ok;
}

function req(id) {
  const el = document.getElementById(id);
  const v = el.value.trim();
  if (!v) {
    el.classList.add("error");
    showErr(id, "Required");
    return false;
  }
  el.classList.remove("error");
  hideErr(id);
  return true;
}

function reqAadhar() {
  const v = document.getElementById("aadhar").value.replace(/\s/g, "");
  if (v.length !== 12) {
    document.getElementById("aadhar").classList.add("error");
    showErr("aadhar", "Enter valid 12-digit Aadhaar number");
    return false;
  }
  document.getElementById("aadhar").classList.remove("error");
  hideErr("aadhar");
  return true;
}

function showErr(id, msg) {
  const e = document.getElementById("err-" + id);
  if (e) {
    e.textContent = msg;
    e.classList.add("show");
  }
}
function hideErr(id) {
  const e = document.getElementById("err-" + id);
  if (e) e.classList.remove("show");
}

// Photo
function previewPhoto(input) {
  if (input.files && input.files[0]) {
    const r = new FileReader();
    r.onload = (e) => {
      const img = document.getElementById("photoPreview");
      img.src = e.target.result;
      img.style.display = "block";
      document.getElementById("photoIcon").style.display = "none";
      document.getElementById("photoText").style.display = "none";
    };
    r.readAsDataURL(input.files[0]);
  }
}

// Aadhaar format
function formatAadhar(el) {
  let v = el.value.replace(/\D/g, "").substring(0, 12);
  el.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
  updateAadharPreview();
}

function updateAadharPreview() {
  const num = document.getElementById("aadhar").value;
  const name = document.getElementById("aadharName").value;
  const p = document.getElementById("aadharPreview");
  if (num.replace(/\s/g, "").length > 0 || name) {
    p.classList.add("show");
    document.getElementById("apNum").textContent = num || "XXXX XXXX XXXX";
    document.getElementById("apName").textContent = "Name: " + (name || "—");
  } else {
    p.classList.remove("show");
  }
}

// Card format
function formatCard(el) {
  let v = el.value.replace(/\D/g, "").substring(0, 16);
  el.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
  const d1 = v.charAt(0);
  const icon = document.getElementById("cardTypeIcon");
  if (d1 === "4") icon.textContent = "💳";
  else if (d1 === "5") icon.textContent = "💳";
  else if (d1 === "3") icon.textContent = "💳";
  else icon.textContent = "💳";
}

function formatExpiry(el) {
  let v = el.value.replace(/\D/g, "").substring(0, 4);
  if (v.length >= 3) v = v.substring(0, 2) + "/" + v.substring(2);
  el.value = v;
}

// Payment method
function setPM(type, btn) {
  selectedPM = type;
  document
    .querySelectorAll(".pm-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document
    .querySelectorAll(".pay-form")
    .forEach((f) => f.classList.remove("active"));
  document.getElementById("pf-" + type).classList.add("active");
}

function selectUpi(el, name) {
  document
    .querySelectorAll(".upi-opt")
    .forEach((o) => o.classList.remove("active"));
  el.classList.add("active");
}

// Submit
function submitForm() {
  let ok = true;
  if (!document.getElementById("termsCheck").checked) {
    showErr("terms", "Please accept the terms to proceed");
    ok = false;
  } else hideErr("terms");

  if (selectedPM === "upi") {
    const upi = document.getElementById("upiId").value.trim();
    if (!upi || !upi.includes("@")) {
      showErr("upiId", "Enter valid UPI ID");
      ok = false;
    } else hideErr("upiId");
  } else if (selectedPM === "card") {
    if (!document.getElementById("cardName").value.trim()) {
      showErr("cardName", "Required");
      ok = false;
    }
    if (
      document.getElementById("cardNum").value.replace(/\s/g, "").length < 16
    ) {
      showErr("cardNum", "Enter valid card number");
      ok = false;
    }
    if (!document.getElementById("cardExp").value.trim()) {
      showErr("cardExp", "Required");
      ok = false;
    }
    if (!document.getElementById("cardCvv").value.trim()) {
      showErr("cardCvv", "Required");
      ok = false;
    }
  } else if (selectedPM === "netbanking") {
    if (!document.getElementById("bankSelect").value) {
      showErr("bankSelect", "Select a bank");
      ok = false;
    }
  }

  if (!ok) return;

  // Build receipt
  const fn = document.getElementById("firstName").value;
  const ln = document.getElementById("lastName").value;
  const txn = "BMV" + Date.now().toString().slice(-8);
  const rows = [
    ["Applicant", fn + " " + ln],
    ["Course", document.getElementById("course").value],
    ["Year", yearNames[parseInt(document.getElementById("yearStudy").value)]],
    ["Session", document.getElementById("session").value || "2025–26"],
    ["Txn ID", txn],
    ["Amount Paid", "₹ " + feeAmount.toLocaleString("en-IN")],
  ];
  document.getElementById("receiptBox").innerHTML = rows
    .map(
      ([k, v]) =>
        `<div class="rb-row"><span class="rb-key">${k}</span><span>${v}</span></div>`,
    )
    .join("");

  // Show success
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("successScreen").classList.add("show");
  document.querySelectorAll(".step-item").forEach((s) => {
    s.classList.remove("active");
    s.classList.add("done");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  document.getElementById("successScreen").classList.remove("show");
  document.querySelector("form,#sec1")?.reset?.();
  document
    .querySelectorAll("input,select,textarea")
    .forEach((el) => (el.value = ""));
  document.getElementById("aadharPreview").classList.remove("show");
  document.getElementById("feeHighlight").style.display = "none";
  document.getElementById("sum-fee").classList.add("hidden");
  ["sum-name", "sum-course", "sum-year", "sum-session", "sum-cat"].forEach(
    (id) => (document.getElementById(id).textContent = "—"),
  );
  document.getElementById("photoPreview").style.display = "none";
  document.getElementById("photoIcon").style.display = "";
  document.getElementById("photoText").style.display = "";
  feeAmount = 0;
  showSection(1);
}

// Live summary updates
["firstName", "lastName"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", updatePayApplicant);
});
document
  .getElementById("session")
  ?.addEventListener("change", updatePayApplicant);
document.getElementById("category")?.addEventListener("change", () => {
  document.getElementById("sum-cat").textContent =
    document.getElementById("category").value || "—";
});
