// ==========================================================
// script.js - CarSeverity AUTOMOTIVE PRECISION
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    // DOM Elements
    const uploadArea = document.querySelector("#uploadArea");
    const imageInput = document.querySelector("#imageInput");
    const uploadDefault = document.querySelector("#uploadDefault");
    const previewContainer = document.querySelector("#previewContainer");
    const previewImage = document.querySelector("#previewImage");
    const fileName = document.querySelector("#fileName");
    const fileSize = document.querySelector("#fileSize");
    const removeImage = document.querySelector("#removeImage");
    const predictButton = document.querySelector("#predictButton");
    const uploadError = document.querySelector("#uploadError");
    const resultCard = document.querySelector("#resultCard");
    const resultContent = document.querySelector("#resultContent");
    const resultSkeleton = document.querySelector("#resultSkeleton");
    const resultClass = document.querySelector("#resultClass");
    const resultConfidence = document.querySelector("#resultConfidence");
    const confidenceFill = document.querySelector("#confidenceFill");
    const resultDescription = document.querySelector("#resultDescription");
    const navbar = document.querySelector("#navbar");
    const navToggle = document.querySelector("#navToggle");
    const navLinks = document.querySelector(".nav-links");

    let selectedFile = null;

    // ==========================================================
    // SCROLL-TRIGGERED ANIMATIONS (ONCE ONLY)
    // ==========================================================
    
    function setupScrollAnimations() {
        const revealElements = document.querySelectorAll(
            ".reveal-from-top, .reveal-from-bottom, .reveal-from-left, .reveal-from-right"
        );
        
        // Set untuk tracking elemen yang sudah pernah dianimasikan
        const animatedElements = new Set();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animatedElements.has(entry.target)) {
                    // Elemen masuk viewport pertama kali - jalankan animasi
                    entry.target.style.animation = "none";
                    
                    // Force reflow untuk restart animasi
                    void entry.target.offsetWidth;
                    
                    // Kembalikan animasi
                    entry.target.style.animation = "";
                    entry.target.style.opacity = "1";
                    
                    // Tandai sebagai sudah dianimasikan
                    animatedElements.add(entry.target);
                    
                    // Stop observasi elemen ini (tidak akan animasi lagi)
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -30px 0px"
        });
        
        // Observe semua elemen reveal
        revealElements.forEach(el => {
            // Set initial state - hidden dulu
            el.style.opacity = "0";
            el.style.animation = "none";
            observer.observe(el);
        });
        
        // Fallback: kalau ada elemen yang belum teranimasi setelah 5 detik
        // (misalnya karena sudah di viewport tapi observer tidak trigger)
        setTimeout(() => {
            revealElements.forEach(el => {
                if (!animatedElements.has(el)) {
                    el.style.animation = "";
                    el.style.opacity = "1";
                    animatedElements.add(el);
                }
            });
        }, 5000);
    }
    
    // Panggil setup animasi
    setupScrollAnimations();

    // Navbar scroll effect
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });

    // Navbar mobile toggle
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            navToggle.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    }

    // Close mobile nav on link click
    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navToggle.classList.remove("active");
            navLinks.classList.remove("active");
        });
    });

    // Upload Area Click
    if (uploadArea && imageInput) {
        uploadArea.addEventListener("click", (e) => {
            if (e.target.closest('#removeImage')) return;
            imageInput.click();
        });
    }

    // Image Input Change
    if (imageInput) {
        imageInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) handleFile(file);
        });
    }

    // Drag & Drop
    if (uploadArea) {
        uploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadArea.classList.add("drag-over");
        });

        uploadArea.addEventListener("dragleave", (e) => {
            e.preventDefault();
            uploadArea.classList.remove("drag-over");
        });

        uploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadArea.classList.remove("drag-over");
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        });
    }

    // Remove Image
    if (removeImage) {
        removeImage.addEventListener("click", (e) => {
            e.stopPropagation();
            clearSelectedFile();
        });
    }

    // Preview Container Click (to change image)
    if (previewContainer) {
        previewContainer.addEventListener("click", (e) => {
            if (e.target.closest('#removeImage')) return;
            if (e.target.tagName !== "IMG") {
                imageInput.click();
            }
        });
    }

    function clearSelectedFile() {
        selectedFile = null;
        imageInput.value = "";
        previewImage.src = "";
        previewContainer.hidden = true;
        uploadDefault.style.display = "flex";
        predictButton.disabled = true;
        resultCard.hidden = true;
        clearError();
    }

    function handleFile(file) {
        clearError();

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            showError("Format gambar tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.");
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showError("Ukuran gambar terlalu besar. Maksimal 10 MB.");
            return;
        }

        selectedFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);

            uploadDefault.style.display = "none";
            previewContainer.hidden = false;

            predictButton.disabled = false;
            resultCard.hidden = true;
        };
        reader.readAsDataURL(file);
    }

    // Predict Button
    if (predictButton) {
        predictButton.addEventListener("click", async () => {
            const file = selectedFile;
            if (!file) {
                showError("Silakan pilih gambar terlebih dahulu.");
                return;
            }

            resultCard.hidden = false;
            resultContent.style.display = "none";
            resultSkeleton.hidden = false;

            predictButton.disabled = true;
            predictButton.innerHTML = `<span>Menganalisis...</span>`;
            clearError();

            try {
                const formData = new FormData();
                formData.append("image", file);

                const response = await fetch("/predict", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Terjadi kesalahan saat prediksi.");
                }

                await new Promise(resolve => setTimeout(resolve, 500));
                showPredictionResult(result);

            } catch (error) {
                console.error("Prediction Error:", error);
                showError(error.message || "Gagal menghubungi server.");
                resultCard.hidden = true;
            } finally {
                predictButton.disabled = false;
                predictButton.innerHTML = `
                    <span>Analisis Gambar</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                `;
                resultSkeleton.hidden = true;
                resultContent.style.display = "block";
            }
        });
    }

    function showPredictionResult(result) {
        const prediction = result.prediction;
        const confidence = Number(result.confidence);

        let displayClass = prediction;
        let severityLevel = "";
        let description = "";

        if (prediction === "01-minor") {
            displayClass = "MINOR";
            severityLevel = "minor";
            description = "Kendaraan terklasifikasi dalam kategori Minor berdasarkan pola visual yang dikenali oleh model. Hasil klasifikasi ini dapat menjadi informasi pendukung dalam penilaian awal klaim asuransi.";
        } else if (prediction === "02-moderate") {
            displayClass = "MODERATE";
            severityLevel = "moderate";
            description = "Kendaraan terklasifikasi dalam kategori Moderate berdasarkan pola visual yang dikenali oleh model. Hasil klasifikasi ini dapat menjadi informasi pendukung dalam penilaian awal klaim asuransi.";
        } else if (prediction === "03-severe") {
            displayClass = "SEVERE";
            severityLevel = "severe";
            description = "Kendaraan terklasifikasi dalam kategori Severe berdasarkan pola visual yang dikenali oleh model. Hasil klasifikasi ini dapat menjadi informasi pendukung dalam penilaian awal klaim asuransi.";
        } else {
            description = "Model menghasilkan klasifikasi berdasarkan pola visual pada citra. Hasil klasifikasi ini dapat menjadi informasi pendukung dalam penilaian awal klaim asuransi.";
        }

        resultClass.textContent = displayClass;
        resultClass.setAttribute("data-severity", severityLevel);
        resultClass.style.opacity = "0";
        resultClass.style.transform = "translateY(20px)";

        resultConfidence.textContent = confidence.toFixed(2) + "%";
        resultConfidence.style.opacity = "0";
        resultConfidence.style.transform = "translateY(20px)";

        resultDescription.textContent = description;
        resultDescription.style.opacity = "0";
        resultDescription.style.transform = "translateY(20px)";

        confidenceFill.style.width = "0%";

        setTimeout(() => {
            resultClass.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
            resultClass.style.opacity = "1";
            resultClass.style.transform = "translateY(0)";
        }, 100);

        setTimeout(() => {
            resultConfidence.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
            resultConfidence.style.opacity = "1";
            resultConfidence.style.transform = "translateY(0)";
        }, 300);

        setTimeout(() => {
            confidenceFill.style.transition = "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)";
            confidenceFill.style.width = confidence + "%";
        }, 400);

        setTimeout(() => {
            resultDescription.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
            resultDescription.style.opacity = "1";
            resultDescription.style.transform = "translateY(0)";
        }, 500);

        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 600);
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    function showError(message) {
        uploadError.textContent = message;
        uploadError.hidden = false;
    }

    function clearError() {
        uploadError.textContent = "";
        uploadError.hidden = true;
    }
});