const fileInput = document.getElementById('FileInput');
const button = document.getElementById('Button');
const result = document.getElementById('Result');

button.addEventListener('click', async () => {
  const file = fileInput.files[0];

  if (!file) {
    result.textContent = 'Choose an image first.';
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
      result.textContent = JSON.stringify(data, null, 2);
      return;
    }

    for (const color of colors) {
      const swatch = document.createElement('span');
      const colorCode = color.html_code;
      swatch.textContent = colorCode || color.closest_palette_color || 'Color';
      swatch.title = `${color.closest_palette_color || 'Image color'} ${colorCode || ''}`;
      swatch.style.display = 'inline-block';
      swatch.style.width = '100px';
      swatch.style.height = '72px';
      swatch.style.margin = '6px';
      swatch.style.padding = '6px';
      swatch.style.boxSizing = 'border-box';
      swatch.style.backgroundColor = colorCode || '#ffffff';
      swatch.style.border = '1px solid #888';
      swatch.addEventListener('click', () => {
        document.getElementById('overlayColor').style.backgroundColor = colorCode || '#ffffff';
        document.getElementById('overlayName').textContent = color.closest_palette_color || 'Image color';
        document.getElementById('overlayCode').textContent = colorCode || '';
        document.getElementById('colorOverlay').classList.add('active');
      });
      result.append(swatch);
    }
  } catch (error) {
    result.textContent = `Could not analyze image: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});
