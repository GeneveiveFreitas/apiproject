const fileInput = document.getElementById('FileInput');
const button = document.getElementById('Button');
const result = document.getElementById('Result');
const colorOverlay = document.getElementById('colorOverlay');
const closeOverlayButton = document.getElementById('closeOverlay');

closeOverlayButton.addEventListener('click', () => {
  colorOverlay.classList.remove('active');
});

button.addEventListener('click', async () => {
  const file = fileInput.files[0];

  if (!file) {
    return;
  }

  button.disabled = true;
  result.textContent = 'Analyzing image...';

  try {
    const imageBuffer = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(imageBuffer);

    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }

    const response = await fetch('/api/analyze-colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: btoa(binary),
        contentType: file.type
      })
    });
    const data = await response.json();

    const colors = data.result?.colors?.image_colors || [];
    result.replaceChildren();

    if (colors.length === 0) {
      console.error('Image analysis returned no colors.', data);
      return;
    }

    for (const color of colors) {
      const swatch = document.createElement('span');
      const colorCode = color.html_code || '#ffffff';
      swatch.className = 'swatch';
      swatch.style.backgroundColor = colorCode;
      swatch.title = `${color.closest_palette_color || 'Image color'} ${colorCode}`;
      swatch.addEventListener('click', async () => {
        const overlayColor = document.getElementById('overlayColor');
        const overlayName = document.getElementById('overlayName');
        const overlayCode = document.getElementById('overlayCode');

        overlayColor.style.backgroundColor = colorCode;
        overlayName.textContent = color.closest_palette_color || 'Image color';
        overlayCode.textContent = '';
        colorOverlay.classList.add('active');

        try {
          const url = new URL('https://www.thecolorapi.com/id');
          url.searchParams.set('hex', colorCode.replace(/^#/, ''));

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Color API request failed (${response.status}).`);
          }
          const colorData = await response.json();
          const hex = colorData.hex?.value || colorCode;
          const rgb = colorData.rgb?.value;
          overlayCode.textContent = rgb ? `HEX: ${hex} | RGB: ${rgb}` : `HEX: ${hex}`;
        } catch (error) {
          overlayName.textContent = color.closest_palette_color || 'Image color';
          overlayCode.textContent = `HEX: ${colorCode}`;
          console.error('Could not load color details.', error);
        }
      });
      result.append(swatch);
    }
  } catch (error) {
    result.replaceChildren();
    console.error('Could not analyze image.', error);
  } finally {
    button.disabled = false;
  }
});