
const fileInput = document.getElementById('FileInput');
const imagePreview = document.getElementById('ImagePreview');
const imagePreviewFrame = document.getElementById('ImagePreviewFrame');
const button = document.getElementById('Button');
const result = document.getElementById('Result');
const colorOverlay = document.getElementById('colorOverlay');
let previewUrl;

fileInput.addEventListener('change', () => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
  }

  const file = fileInput.files[0];
  if (!file) {
    fileInput.hidden = false;
    button.hidden = true;
    imagePreview.hidden = true;
    imagePreview.removeAttribute('src');
    imagePreviewFrame.classList.remove('has-image');
    return;
  }

  previewUrl = URL.createObjectURL(file);
  fileInput.hidden = true;
  button.hidden = false;
  imagePreview.src = previewUrl;
  imagePreview.hidden = false;
  imagePreviewFrame.classList.add('has-image');
});

document.getElementById('ClearImageButton').addEventListener('click', () => {
  fileInput.value = '';
  fileInput.dispatchEvent(new Event('change'));
});

document.getElementById('closeOverlay').addEventListener('click', () => {
  colorOverlay.classList.remove('active');
});

button.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  button.disabled = true;
  result.textContent = 'Analyzing image...';

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';

    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }

    const response = await fetch('/api/analyze-colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: btoa(binary),
        contentType: file.type
      })
    });

    const data = await response.json();
    const colors = data.result?.colors?.image_colors || [];

    result.replaceChildren();

    Array.from({ length: 5 }, (_, index) => colors[index]).forEach(color => {
      const swatch = document.createElement('span');
      swatch.className = 'swatch';

      if (!color) {
        swatch.classList.add('swatch-placeholder');
        swatch.title = 'No color available';
        swatch.setAttribute('aria-hidden', 'true');
        result.append(swatch);
        return;
      }

      const code = color.html_code || '#ffffff';
      const name = color.closest_palette_color || 'Image color';

      swatch.style.backgroundColor = code;
      swatch.title = `${name} ${code}`;

      swatch.addEventListener('click', async () => {
        const overlayColor = document.getElementById('overlayColor');
        const overlayName = document.getElementById('overlayName');
        const overlayCode = document.getElementById('overlayCode');

        overlayColor.style.backgroundColor = code;
        overlayName.textContent = name;
        overlayCode.textContent = '';
        colorOverlay.classList.add('active');

        try {
          const response = await fetch(
            `https://www.thecolorapi.com/id?hex=${code.replace('#', '')}`
          );
          const data = await response.json();

          overlayCode.textContent = [
            `HEX: ${data.hex?.value || code}`,
            `RGB: ${data.rgb?.value || ''}`,
            `HSL: ${data.hsl?.value || ''}`,
            `HSV: ${data.hsv?.value || ''}`,
            `CMYK: ${data.cmyk?.value || ''}`
          ].filter(line => !line.endsWith(': ')).join('\n');
        } catch {
          overlayCode.textContent = '';
        }
      });

      result.append(swatch);
    });
  } catch {
    result.replaceChildren();
  } finally {
    button.disabled = false;
  }
});
