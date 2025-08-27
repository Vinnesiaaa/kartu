// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const form = document.getElementById('card-form');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const previewSection = document.getElementById('preview-section');
    const cardPreview = document.getElementById('card-preview');
    const printBtn = document.getElementById('print-btn');
    const downloadPngBtn = document.getElementById('download-png-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadVcfBtn = document.getElementById('download-vcf-btn');
    const shareBtn = document.getElementById('share-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const qrCodeElement = document.getElementById('qr-code');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    let qrCode;
    let photoUrl = '';
    let qrLogoUrl = '';

    // Load saved data
    loadFromLocalStorage();

    // Dark mode toggle
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light');
        darkModeToggle.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
    });

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Setup drag-and-drop zones
    const photoDropZone = document.getElementById('photo-drop-zone');
    const photoInput = document.getElementById('profile-photo');
    setupDropZone(photoDropZone, photoInput, (url) => {
        photoUrl = url;
        document.getElementById('photo-preview').src = url;
        document.getElementById('photo-preview').style.display = 'block';
    });

    const qrLogoDropZone = document.getElementById('qr-logo-drop-zone');
    const qrLogoInput = document.getElementById('qr-logo');
    setupDropZone(qrLogoDropZone, qrLogoInput, (url) => {
        qrLogoUrl = url;
        document.getElementById('qr-logo-preview').src = url;
        document.getElementById('qr-logo-preview').style.display = 'block';
    });

    function setupDropZone(zone, input, callback) {
        zone.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                callback(URL.createObjectURL(file));
            } else {
                showError('Please upload a valid image file.');
            }
        });
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#4caf50';
        });
        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = '#444';
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#444';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                callback(URL.createObjectURL(file));
            } else {
                showError('Please upload a valid image file.');
            }
        });
    }

    // Generate VCard
    generateBtn.addEventListener('click', async () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            showError('Please fill all required fields.');
            return;
        }
        if (!photoUrl) {
            showError('Please upload a profile photo/logo.');
            return;
        }
        loadingSpinner.style.display = 'block';
        try {
            const data = getFormData();
            applyCardStyles(data);
            const qrData = data.qrUrl || generateVCard(data);
            updateQRCode(qrData, data);
            updatePreview(data);
            previewSection.style.display = 'block';
            localStorage.setItem('cardData', JSON.stringify(data));
            localStorage.setItem('photoUrl', photoUrl);
            localStorage.setItem('qrLogoUrl', qrLogoUrl);
            // Update dynamic meta description
            document.querySelector('meta[name="description"]').content = `QEO CARD: ${data.name}'s digital business card with customizable QR code and ${data.cardTemplate} template.`;
            // Generate shareable link
            const shareUrl = `${window.location.origin}?data=${btoa(JSON.stringify(data))}&photo=${btoa(photoUrl || '')}&qrlogo=${btoa(qrLogoUrl || '')}`;
            document.getElementById('share-url').href = shareUrl;
            document.getElementById('share-url').textContent = shareUrl;
            document.getElementById('share-link').style.display = 'block';
        } catch (error) {
            console.error('Generate Error:', error);
            showError('Error generating VCard. Please try again.');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function getFormData() {
        return {
            name: document.getElementById('name').value,
            jobTitle: document.getElementById('job-title').value,
            company: document.getElementById('company').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            website: document.getElementById('website').value,
            address: document.getElementById('address').value,
            linkedin: document.getElementById('linkedin').value,
            twitter: document.getElementById('twitter').value,
            instagram: document.getElementById('instagram').value,
            qrUrl: document.getElementById('qr-url').value,
            qrColor: document.getElementById('qr-color').value,
            qrBgColor: document.getElementById('qr-bg-color').value,
            qrStyle: document.getElementById('qr-style').value,
            qrErrorCorrection: document.getElementById('qr-error-correction').value,
            cardTemplate: document.getElementById('card-template').value,
            cardBgColor: document.getElementById('card-bg-color').value,
            cardTextColor: document.getElementById('card-text-color').value,
            cardFont: document.getElementById('card-font').value
        };
    }

    function applyCardStyles(data) {
        cardPreview.className = `card ${data.cardTemplate}`;
        cardPreview.style.backgroundColor = data.cardBgColor;
        cardPreview.style.color = data.cardTextColor;
        cardPreview.style.fontFamily = data.cardFont;
    }

    function generateVCard(data) {
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name}\nORG:${data.company}\nTITLE:${data.jobTitle}\nTEL:${data.phone}\nEMAIL:${data.email}\nURL:${data.website}\nADR:${data.address}\nEND:VCARD`;
    }

    function updateQRCode(qrData, data) {
        const options = {
            width: 160,
            height: 160,
            data: qrData,
            dotsOptions: { color: data.qrColor, type: data.qrStyle },
            backgroundOptions: { color: data.qrBgColor },
            image: qrLogoUrl || undefined,
            imageOptions: { crossOrigin: "anonymous", margin: 5 },
            qrOptions: { errorCorrectionLevel: data.qrErrorCorrection }
        };
        if (qrCode) qrCode.update(options);
        else qrCode = new QRCodeStyling(options);
        qrCodeElement.innerHTML = '';
        qrCode.append(qrCodeElement);
    }

    function updatePreview(data) {
        document.getElementById('card-photo').src = photoUrl || 'https://via.placeholder.com/120';
        document.getElementById('card-name').textContent = data.name || 'Name';
        document.getElementById('card-job-title').textContent = data.jobTitle || '';
        document.getElementById('card-company').textContent = data.company || '';
        document.getElementById('card-email').textContent = data.email ? `Email: ${data.email}` : '';
        document.getElementById('card-phone').textContent = data.phone ? `Phone: ${data.phone}` : '';
        document.getElementById('card-website').textContent = data.website ? `Website: ${data.website}` : '';
        document.getElementById('card-address').textContent = data.address ? `Address: ${data.address}` : '';
        
        updateSocialLink('card-linkedin', data.linkedin, 'LinkedIn');
        updateSocialLink('card-twitter', data.twitter, 'Twitter/X');
        updateSocialLink('card-instagram', data.instagram, 'Instagram');
    }

    function updateSocialLink(id, url, text) {
        const link = document.getElementById(id);
        link.href = url || '#';
        link.textContent = url ? text : '';
        link.style.display = url ? 'inline' : 'none';
    }

    // Print
    printBtn.addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Print VCard</title><link rel="stylesheet" href="style.css"></head><body>');
        printWindow.document.write(cardPreview.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    });

    // Download PNG
    downloadPngBtn.addEventListener('click', () => {
        html2canvas(cardPreview, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'qeo-vcard.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(() => showError('Error downloading PNG.'));
    });

    // Download PDF
    downloadPdfBtn.addEventListener('click', async () => {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [90, 55] });
            const canvas = await html2canvas(cardPreview, { scale: 3 });
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, 90, 55);
            pdf.save('qeo-vcard.pdf');
        } catch (error) {
            showError('Error downloading PDF.');
        }
    });

    // Download vCard
    downloadVcfBtn.addEventListener('click', () => {
        const data = getFormData();
        const vcard = generateVCard(data);
        const blob = new Blob([vcard], { type: 'text/vcard' });
        const link = document.createElement('a');
        link.download = 'qeo-vcard.vcf';
        link.href = URL.createObjectURL(blob);
        link.click();
    });

    // Share
    shareBtn.addEventListener('click', () => {
        const shareData = {
            title: 'My QEO VCard',
            text: 'Check out my professional digital business card!',
            url: document.getElementById('share-url').href
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => showError('Error sharing VCard.'));
        } else {
            showError('Share this link: ' + shareData.url);
        }
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        form.reset();
        previewSection.style.display = 'none';
        qrCodeElement.innerHTML = '';
        photoUrl = '';
        qrLogoUrl = '';
        document.getElementById('photo-preview').style.display = 'none';
        document.getElementById('qr-logo-preview').style.display = 'none';
        document.getElementById('share-link').style.display = 'none';
        cardPreview.className = 'card';
        cardPreview.style = '';
        localStorage.clear();
        errorMessage.style.display = 'none';
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => errorMessage.style.display = 'none', 3000);
    }

    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('cardData');
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const elem = document.getElementById(key);
                if (elem) elem.value = data[key];
            });
        }
        photoUrl = localStorage.getItem('photoUrl') || '';
        qrLogoUrl = localStorage.getItem('qrLogoUrl') || '';
        if (photoUrl) {
            document.getElementById('photo-preview').src = photoUrl;
            document.getElementById('photo-preview').style.display = 'block';
        }
        if (qrLogoUrl) {
            document.getElementById('qr-logo-preview').src = qrLogoUrl;
            document.getElementById('qr-logo-preview').style.display = 'block';
        }
        // Load from URL params for sharing
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('data')) {
            try {
                const data = JSON.parse(atob(urlParams.get('data')));
                Object.keys(data).forEach(key => {
                    const elem = document.getElementById(key);
                    if (elem) elem.value = data[key];
                });
                photoUrl = atob(urlParams.get('photo') || '');
                qrLogoUrl = atob(urlParams.get('qrlogo') || '');
                generateBtn.click();
            } catch (e) {
                console.error('Invalid share link:', e);
            }
        }
    }
});
