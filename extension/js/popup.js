document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Management ---
  const themeToggle = document.getElementById('theme-toggle');
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme === 'dark') document.body.setAttribute('data-theme', 'dark');
  });

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.body.removeAttribute('data-theme');
      chrome.storage.local.set({ theme: 'light' });
    } else {
      document.body.setAttribute('data-theme', 'dark');
      chrome.storage.local.set({ theme: 'dark' });
    }
  });

  // --- Navigation ---
  const navBtns = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.remove('hidden');
    });
  });

  // --- AI Shortcuts ---
  const grid = document.getElementById('shortcuts-grid');
  const search = document.getElementById('ai-search');
  
  const renderShortcuts = (filter = "") => {
    grid.innerHTML = "";
    AI_SHORTCUTS.filter(s => s.name.toLowerCase().includes(filter.toLowerCase())).forEach(tool => {
      const a = document.createElement('a');
      a.href = tool.url;
      a.target = "_blank";
      a.className = "card";
      a.innerHTML = `<strong>${tool.name}</strong><span class="subtitle" style="margin:0">${tool.cat}</span>`;
      grid.appendChild(a);
    });
  };
  renderShortcuts();
  search.addEventListener('input', (e) => renderShortcuts(e.target.value));

  // --- Image to PDF ---
  const img2pdfInput = document.getElementById('img2pdf-input');
  const img2pdfPreview = document.getElementById('img2pdf-preview');
  const btnGeneratePdf = document.getElementById('btn-generate-pdf');
  let selectedImages = [];

  img2pdfInput.addEventListener('change', async (e) => {
    selectedImages = Array.from(e.target.files);
    img2pdfPreview.innerHTML = "";
    for (const file of selectedImages) {
      const dataUrl = await Helpers.fileToDataURL(file);
      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = "preview-img";
      img.style.height = "80px";
      img2pdfPreview.appendChild(img);
    }
    if (selectedImages.length > 0) btnGeneratePdf.classList.remove('hidden');
  });

  btnGeneratePdf.addEventListener('click', async () => {
    if (!window.jspdf) {
      alert("jsPDF library not found. Please run the setup.js script to download offline dependencies.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    for (let i = 0; i < selectedImages.length; i++) {
      if (i > 0) doc.addPage();
      const imgData = await Helpers.fileToDataURL(selectedImages[i]);
      // Simple scaling to fit page
      doc.addImage(imgData, 'JPEG', 10, 10, 190, 277); 
    }
    doc.save("jst-clickzy-converted.pdf");
  });

  // --- PDF to Image ---
  const pdf2imgInput = document.getElementById('pdf2img-input');
  const pdf2imgPreview = document.getElementById('pdf2img-preview');
  
  pdf2imgInput.addEventListener('change', async (e) => {
    if (!window.pdfjsLib) {
      alert("PDF.js library not found. Please run the setup.js script.");
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;
    
    const arrayBuffer = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    pdf2imgPreview.innerHTML = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      
      const img = document.createElement('img');
      img.src = canvas.toDataURL();
      img.className = "preview-img";
      pdf2imgPreview.appendChild(img);
    }
  });

  // --- Screenshot ---
  const btnCapture = document.getElementById('btn-capture');
  const screenshotResult = document.getElementById('screenshot-result');
  const screenshotImg = document.getElementById('screenshot-img');
  const btnDlScreenshot = document.getElementById('btn-dl-screenshot');
  let currentScreenshot = "";

  btnCapture.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (response) => {
      if (response && response.dataUrl) {
        currentScreenshot = response.dataUrl;
        screenshotImg.src = currentScreenshot;
        screenshotResult.classList.remove('hidden');
      } else {
        alert("Could not capture tab. Check permissions.");
      }
    });
  });

  btnDlScreenshot.addEventListener('click', () => {
    Helpers.downloadURI(currentScreenshot, "jst-clickzy-screenshot.png");
  });

  // --- Background Remove ---
  const bgApiKey = document.getElementById('bg-api-key');
  const btnSaveKey = document.getElementById('btn-save-key');
  const bgInput = document.getElementById('bgremove-input');
  const bgResultDiv = document.getElementById('bgremove-result');
  const bgImg = document.getElementById('bgremove-img');
  const bgStatus = document.getElementById('bg-status');
  const btnDlBg = document.getElementById('btn-dl-bgremove');

  chrome.storage.local.get(['removeBgKey'], (res) => {
    if (res.removeBgKey) bgApiKey.value = res.removeBgKey;
  });

  btnSaveKey.addEventListener('click', () => {
    chrome.storage.local.set({ removeBgKey: bgApiKey.value }, () => {
      alert("API Key saved securely to local storage.");
    });
  });

  bgInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    chrome.storage.local.get(['removeBgKey'], async (res) => {
      if (!res.removeBgKey) {
        alert("Please save your remove.bg API key first.");
        return;
      }

      bgResultDiv.classList.remove('hidden');
      bgImg.classList.add('hidden');
      btnDlBg.classList.add('hidden');
      bgStatus.textContent = "Uploading to remove.bg...";

      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('image_file', file);

      try {
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: { 'X-Api-Key': res.removeBgKey },
          body: formData
        });

        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        bgImg.src = url;
        bgImg.classList.remove('hidden');
        btnDlBg.classList.remove('hidden');
        bgStatus.textContent = "Done!";

        btnDlBg.onclick = () => {
          const a = document.createElement('a');
          a.href = url;
          a.download = "no-bg.png";
          a.click();
        };

      } catch (err) {
        bgStatus.textContent = `Error: ${err.message}`;
      }
    });
  });
});