function showMessage(message, type = "success") {
  const messageDiv = document.getElementById("message");
  if (messageDiv) {
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = "block";
    setTimeout(() => { messageDiv.style.display = "none"; }, 5000);
  }
}

function goBack() {
  window.location.href = "http://localhost:3000";
}

function selectCategory(category) {
  document.querySelectorAll(".category-item").forEach((item) => item.classList.remove("selected"));
  event.target.closest(".category-item").classList.add("selected");
  window.selectedCategory = category;
  document.getElementById("selected-category").value = category;
}

// ฟังก์ชันแสดง/ซ่อน ช่องบันทึนอนพัก
function toggleObservationNotes() {
  const status = document.getElementById("patient-status");
  const notesDiv = document.getElementById("observation-notes");

  if (status && notesDiv) {
    if (status.value === "observation") {
      notesDiv.classList.remove("hidden");
    } else {
      notesDiv.classList.add("hidden");
    }
  }
}

function setupPhotoUpload() {
  const photoInput = document.getElementById("photo-input");

  if (!window.attachedPhotos) {
    window.attachedPhotos = [];
  }

  if (photoInput) {
    photoInput.setAttribute("multiple", "multiple");

    photoInput.addEventListener("change", function (e) {
      const files = e.target.files;
      if (files.length === 0) return;

      if (window.attachedPhotos.length + files.length > 10) {
        showMessage("สามารถแนบรูปได้สูงสุด 10 รูป", "error");
        return;
      }

      Array.from(files).forEach((file, index) => {
        if (file.size > 5 * 1024 * 1024) {
          showMessage(`ไฟล์ ${file.name} มีขนาดเกิน 5MB`, "error");
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          window.attachedPhotos.push({
            data: e.target.result,
            name: file.name,
            id: Date.now() + index,
          });
          updatePhotoPreview();
        };
        reader.readAsDataURL(file); // แปลงเป็น Base64
      });

      photoInput.value = "";
    });
  }
}

function updatePhotoPreview() {
  const photoPreview = document.getElementById("photo-preview");

  if (!photoPreview) return;

  if (window.attachedPhotos.length === 0) {
    photoPreview.innerHTML = "";
    return;
  }

  photoPreview.innerHTML = '<div class="photo-gallery">' +
    window.attachedPhotos.map((photo) => `
      <div class="photo-item">
        <img src="${photo.data}" >
        <button type="button" class="photo-remove-btn" onclick="removePhoto(${photo.id})" title="ลบรูปนี้">×</button>
        <div class="photo-label"></div>
      </div>
    `).join("") + "</div>";
}

function removePhoto(photoId) {
  window.attachedPhotos = window.attachedPhotos.filter((photo) => photo.id !== photoId);
  updatePhotoPreview();
  showMessage("ลบรูปเรียบร้อยแล้ว", "success");
}