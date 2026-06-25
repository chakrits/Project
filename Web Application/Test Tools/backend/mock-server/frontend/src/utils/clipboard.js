export const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, falling back', err);
    }
  }
  
  // Fallback for non-secure contexts (e.g. accessed via IP address)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Prevent scrolling and keep it out of sight
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) return true;
    
    // If execCommand is also blocked
    window.prompt("เบราว์เซอร์บล็อกการคัดลอก (HTTP) กรุณากด Ctrl+C เพื่อ Copy", text);
    return true;
  } catch (err) {
    console.error('Fallback clipboard copy failed', err);
    window.prompt("เบราว์เซอร์บล็อกการคัดลอก (HTTP) กรุณากด Ctrl+C เพื่อ Copy", text);
    return true;
  }
};
