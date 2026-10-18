const fileInput = document.getElementById('FileInput');
const button = document.getElementById('Button');
const result = document.getElementById('Result');

const apiKey = 'acc_5bba5691eabd61a';
const apiSecret = '8b49010981fc62bf09331208eaba3c7e';

button.addEventListener('click', async () => {
  const file = fileInput.files[0];

  if (!file) {
    result.textContent = 'Choose an image first.';
    return;
  }

  button.disabled = true;
  result.textContent = 'Analyzing image...';

  try {
    const formData = new FormData();
    formData.append('image_upload', file);

    const response = await fetch('https://api.imagga.com/v2/colors', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`
      },
      body: formData
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
      result.append(swatch);
    }
  } catch (error) {
    result.textContent = `Could not analyze image: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});
