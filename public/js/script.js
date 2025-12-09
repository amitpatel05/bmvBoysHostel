// PASSWORD EYE
const togglePassword = document.getElementById("togglePassword");
const passwordField = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  passwordField.type = passwordField.type === "password" ? "text" : "password";
});

// Avatar upload handler
document.getElementById("avatarInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file && file.size > 5 * 1024 * 1024) {
    alert("Image too large! Max 5MB");
    return;
  }
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.querySelector(
        ".profile-avatar"
      ).style.backgroundImage = `url(${e.target.result})`;
      document.querySelector(".profile-avatar").innerHTML =
        '<div class="avatar-upload">📷</div>';
    };
    reader.readAsDataURL(file);
  }
});
// Real-time validation
const inputs = [
  "email",
  "phone",
  "emergencyContact",
  "bloodGroup",
  "address",
  "course",
  "year",
];
inputs.forEach((id) => {
  document.getElementById(id).addEventListener("blur", validateField);
  document.getElementById(id).addEventListener("input", validateField);
});
function validateField(e) {
  const field = e.target;
  const errorEl = document.getElementById(field.id + "Error");
  field.classList.remove("error");
  errorEl.style.display = "none";
  switch (field.id) {
    case "email":
      if (!field.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showError(field, errorEl);
      }
      break;
    case "phone":
    case "emergencyContact":
      if (!field.value.match(/\+91\s?\d{10}$/)) {
        showError(field, errorEl);
      }
      break;
    case "address":
      if (field.value.length < 20) {
        showError(field, errorEl);
      }
      break;
  }
}

function showError(field, errorEl) {
  field.classList.add("error");
  errorEl.style.display = "block";
}

// Auto-format phone numbers
["phone", "emergencyContact"].forEach((id) => {
  document.getElementById(id).addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 10) {
      value = "+91 " + value.slice(-10);
    }
    e.target.value = value;
  });
});
// Form submission with full validation
document.getElementById("profileForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Check all required fields
  let isValid = true;
  document.querySelectorAll("[required]").forEach((field) => {
    if (!field.value.trim()) {
      showError(field, document.getElementById(field.id + "Error"));
      isValid = false;
    }
  });
  if (isValid) {
    const formData = new FormData(this);
    document.querySelector(".btn-primary").innerHTML = "⏳ Saving...";
    document.querySelector(".btn-primary").disabled = true;

    // Simulate API call
    setTimeout(() => {
      document.getElementById("successMessage").textContent =
        "✅ Profile updated successfully!";
      document.getElementById("successMessage").style.display = "block";
      // POST to Node.js: app.post('/api/students/:id/profile', upload.single('avatar'), ...)
    }, 1500);
  }
});
