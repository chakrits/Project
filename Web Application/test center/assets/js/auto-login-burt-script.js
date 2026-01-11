/**
 * Auto Login BURT Generator - JavaScript Logic & Functions
 * Author: Chakrit Salaeman & Claude
 * Description: Handles all logic for generating encrypted BURT auto-login URLs
 */

// Global variables
let systemConfig = null;
let currentParams = [];

// BURT Parameter definitions with default values
const BURT_PARAMETER_DEFINITIONS = [
  { name: 'en', label: 'Encounter Number', type: 'text', defaultValue: 'I01-25-0000477', enabled: true },
  { name: 'bu_code', label: 'Business Unit Code', type: 'text', defaultValue: '001', enabled: true },
  { name: 'timestamp', label: 'Unix Timestamp', type: 'number', defaultValue: '', enabled: true, autoFill: 'unix' },
  { name: 'username', label: 'Username', type: 'text', defaultValue: 'myusername', enabled: true },
  { name: 'user_bu', label: 'User Business Unit', type: 'text', defaultValue: '001', enabled: true },
  { name: 'client_id', label: 'Client ID', type: 'password', defaultValue: 'Bearer lf5k41h09s5b21vs82rnwx5mlo0jwfut', enabled: true }
];

/**
 * Initialize the application when DOM is ready
 */
$(document).ready(function() {
  console.log('Auto Login BURT Generator - Initializing...');
  
// ตรวจสอบว่า CryptoJS โหลดสำเร็จหรือไม่
  if (typeof CryptoJS !== 'undefined') {
    console.log('✅ CryptoJS loaded successfully from local file');
    console.log('CryptoJS version:', CryptoJS.lib.WordArray ? 'Available' : 'Error');
  } else {
    console.error('❌ CryptoJS failed to load');
    showNotification('CryptoJS library not loaded. Encryption will not work.', 'danger');
  }


  // Initialize form components
  initializeBurtParameterForm();
  initializeEventHandlers();
  initializeAESModes();
  setInitialTimestamp();
  updateEnabledCount();
  
  console.log('Auto Login BURT Generator - Ready!');
});

/**
 * Initialize AES modes dropdown
 */
function initializeAESModes() {
  const aesModeSelect = $('#aesMode');
  aesModeSelect.empty();
  
  // Add AES modes
  const modes = [
    { value: 'CBC', text: 'CBC - Cipher Block Chaining' },
    { value: 'CFB', text: 'CFB - Cipher Feedback' },
    { value: 'CTR', text: 'CTR - Counter' },
    { value: 'ECB', text: 'ECB - Electronic Codebook' },
    { value: 'OFB', text: 'OFB - Output Feedback' }
  ];
  
  modes.forEach(mode => {
    aesModeSelect.append(`<option value="${mode.value}">${mode.text}</option>`);
  });
  
  // Set default to ECB
  aesModeSelect.val('ECB');
}

/**
 * Generate BURT parameter form dynamically (2 columns layout)
 */
function initializeBurtParameterForm() {
  const parametersContainer = $('#parametersForm');
  parametersContainer.empty();
  
  // Create 2-column layout
  const leftColumn = $('<div class="col-md-6 parameters-column"></div>');
  const rightColumn = $('<div class="col-md-6 parameters-column"></div>');
  
  BURT_PARAMETER_DEFINITIONS.forEach((param, index) => {
    const parameterGroup = createBurtParameterGroup(param);
    
    // Distribute parameters alternately between columns
    if (index % 2 === 0) {
      leftColumn.append(parameterGroup);
    } else {
      rightColumn.append(parameterGroup);
    }
  });
  
  // Create row container and append columns
  const rowContainer = $('<div class="row parameters-row"></div>');
  rowContainer.append(leftColumn);
  rowContainer.append(rightColumn);
  
  parametersContainer.append(rowContainer);
}

/**
 * Create individual BURT parameter group HTML
 */
function createBurtParameterGroup(param) {
  const autoFillButton = param.autoFill ? createBurtAutoFillButton(param) : '';
  
  return `
    <div class="parameter-group ${param.enabled ? 'enabled' : 'disabled'}">
      <div class="parameter-header">
        <div class="form-check form-switch">
          <input class="form-check-input param-toggle" type="checkbox" 
                 id="toggle_${param.name}" ${param.enabled ? 'checked' : ''}>
          <label class="form-check-label param-label" for="toggle_${param.name}">
            <strong>${param.name}</strong> <span class="text-muted">(${param.label})</span>
          </label>

        </div>
        ${autoFillButton}
      </div>
      <div class="parameter-input">
        <input type="${param.type}" class="form-control param-input" 
               id="param_${param.name}" 
               placeholder="${param.defaultValue || 'Enter ' + param.label.toLowerCase()}" 
               value="${param.defaultValue}"
               ${param.enabled ? '' : 'disabled'}>
      </div>
    </div>
  `;
}

/**
 * Create auto-fill button for special fields
 */
function createBurtAutoFillButton(param) {
  const buttonText = param.autoFill === 'unix' ? 'Now' : 'Auto';
  const iconClass = param.autoFill === 'unix' ? 'clock' : 'magic';
  
  return `
    <button type="button" class="btn btn-sm btn-outline-primary auto-fill-btn" 
            data-target="param_${param.name}" data-fill-type="${param.autoFill}">
      <i class="fas fa-${iconClass}"></i> ${buttonText}
    </button>
  `;
}

/**
 * Setup all event handlers
 */
function initializeEventHandlers() {
  // Parameter toggle switches
  $(document).on('change', '.param-toggle', handleParameterToggle);
  
  // Auto-fill buttons
  $(document).on('click', '.auto-fill-btn', handleAutoFill);
  
  // Bulk action buttons
  $('#enableAllBtn').on('click', enableAllParameters);
  $('#disableAllBtn').on('click', disableAllParameters);
  $('#resetFormBtn').on('click', resetForm);
  
  // Special buttons
  $('#generateTimestampBtn').on('click', generateCurrentTimestamp);
  $('#generateIvBtn').on('click', generateRandomIV);
  
  // Generation and action buttons
  $('#generateUrlBtn').on('click', generateBurtLoginUrl);
  $('#copyUrlBtn').on('click', copyUrlToClipboard);
  $('#copyJsonBtn').on('click', copyJsonToClipboard);
  $('#testUrlBtn').on('click', testUrl);
}

/**
 * Handle parameter toggle switch changes
 */
function handleParameterToggle() {
  const targetId = this.id.replace('toggle_', 'param_');
  const targetInput = $(`#${targetId}`);
  const parameterGroup = $(this).closest('.parameter-group');
  
  if (this.checked) {
    targetInput.prop('disabled', false);
    parameterGroup.removeClass('disabled').addClass('enabled');
  } else {
    targetInput.prop('disabled', true);
    parameterGroup.removeClass('enabled').addClass('disabled');
  }
  
  updateEnabledCount();
}

/**
 * Generate random IV for AES encryption
 */
function generateRandomIV() {
  try {
    // Generate 16 bytes (128 bits) random IV
    const randomWords = CryptoJS.lib.WordArray.random(16);
    const hexIV = randomWords.toString(CryptoJS.enc.Hex);
    
    $('#ivInput').val(hexIV);
    showNotification('Random IV generated successfully', 'success');
    
  } catch (error) {
    console.error('IV generation error:', error);
    showNotification('Failed to generate IV: ' + error.message, 'danger');
  }
}

/**
 * Generate current Unix timestamp
 */
function generateCurrentTimestamp() {
  const unixTimestamp = Math.floor(Date.now() / 1000);
  $('#param_timestamp').val(unixTimestamp);
  showNotification('Current Unix timestamp generated', 'success');
}

/**
 * Handle auto-fill button clicks
 */
function handleAutoFill() {
  const targetId = $(this).data('target');
  const fillType = $(this).data('fill-type');
  const targetInput = $(`#${targetId}`);
  
  let fillValue = '';
  
  switch (fillType) {
    case 'unix':
      fillValue = Math.floor(Date.now() / 1000);
      break;
  }
  
  targetInput.val(fillValue);
  showNotification('Auto-filled with current value', 'success');
}

/**
 * Set initial timestamp value
 */
function setInitialTimestamp() {
  const unixTimestamp = Math.floor(Date.now() / 1000);
  $('#param_timestamp').val(unixTimestamp);
}

/**
 * Update enabled parameters counter
 */
function updateEnabledCount() {
  const enabledCount = $('.param-toggle:checked').length;
  $('#enabledCount').text(enabledCount);
}

/**
 * Enable all parameters
 */
function enableAllParameters() {
  $('.param-toggle').prop('checked', true).trigger('change');
  showNotification('All parameters enabled', 'success');
}

/**
 * Disable all parameters
 */
function disableAllParameters() {
  $('.param-toggle').prop('checked', false).trigger('change');
  showNotification('All parameters disabled', 'warning');
}

/**
 * Reset form to default values
 */
function resetForm() {
  // Reset all input values to defaults
  BURT_PARAMETER_DEFINITIONS.forEach(param => {
    const input = $(`#param_${param.name}`);
    input.val(param.defaultValue);
    
    // Reset toggle states
    const toggle = $(`#toggle_${param.name}`);
    toggle.prop('checked', param.enabled).trigger('change');
  });
  
  // Reset timestamp
  setInitialTimestamp();
  
  // Hide result card
  $('#resultCard').hide();
  
  showNotification('Form reset to default values', 'info');
}

/**
 * Generate BURT login URL with AES encryption (improved logic)
 */
async function generateBurtLoginUrl() {
  try {
    // Validate inputs
    const validation = validateInputs();
    if (!validation.isValid) {
      showNotification(validation.message, 'danger');

      // เพิ่ม - Focus และ highlight error field
      if (validation.focusElement) {
        focusAndHighlightError(validation.focusElement);
      }

      return;
    }

    // Get enabled parameters (including empty ones)
    const enabledParams = getEnabledParameters();
    if (enabledParams.length === 0) {
      showNotification('Please enable at least one parameter', 'warning');
      return;
    }
    
    // Show generating state
    const generateBtn = $('#generateUrlBtn');
    const originalText = generateBtn.html();
    generateBtn.prop('disabled', true)
              .html('<i class="fas fa-spinner fa-spin me-2"></i>Generating...');
    
    // Build JSON object (including empty values)
    const jsonObject = buildJsonObject(enabledParams);
    const jsonString = JSON.stringify(jsonObject);
    console.log('JSON string:', jsonString);
    console.log('Enabled parameters:', enabledParams);
    
    // Encrypt the JSON string
    const secretKey = $('#secretKey').val().trim();
    const aesMode = $('#aesMode').val();
    const encryptedKey = encryptWithAES(jsonString, secretKey, aesMode);
    console.log('Encrypted key:', encryptedKey);
    
    // Build final URL
    const finalUrl = buildBurtFinalUrl(encryptedKey);
    console.log('Final URL:', finalUrl);
    
    // Display results
    displayBurtResults(jsonString, encryptedKey, finalUrl, enabledParams.length);
    
    showNotification('BURT Login URL generated successfully!', 'success');
    
  } catch (error) {
    console.error('Generation error:', error);
    showNotification('Error generating URL: ' + error.message, 'danger');
  } finally {
    // Restore button state
    const generateBtn = $('#generateUrlBtn');
    generateBtn.prop('disabled', false)
              .html('<i class="fas fa-link me-2"></i>Generate BURT Login URL');
  }
}



/**
 * Validate form inputs
 */
function validateInputs() {
  const targetUrl = $('#targetUrl').val().trim();
  const appId = $('#appId').val().trim();
  const secretKey = $('#secretKey').val().trim();
  const customIV = $('#ivInput').val().trim();
  
  if (!targetUrl) {
    return { isValid: false, message: 'Target URL is required' , focusElement: '#targetUrl'};
  }
  
  // Validate URL format
  try {
    new URL(targetUrl);
  } catch {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
  
  if (!appId) {
    return { isValid: false, message: 'Application ID is required', focusElement: '#appId'};
  }
  
  if (!secretKey) {
    return { isValid: false, message: 'Secret Key is required', focusElement: '#secretKey' };
  }
  
  if (secretKey.length < 8) {
    return { isValid: false, message: 'Secret Key must be at least 8 characters long' , focusElement: '#secretKey'};
  }
  
  // Validate IV if provided
  if (customIV && (customIV.length !== 32 || !/^[0-9a-fA-F]+$/.test(customIV))) {
    return { isValid: false, message: 'IV must be 32 hexadecimal characters (16 bytes)' };
  }
  
  return { isValid: true };
}

/**
 * Get enabled parameters with their values (improved logic)
 */
function getEnabledParameters() {
  const params = [];
  
  $('.param-toggle:checked').each(function() {
    const paramName = this.id.replace('toggle_', '');
    const paramValue = $(`#param_${paramName}`).val().trim();
    
    // Handle different parameter types
    if (paramName === 'timestamp') {
      // Timestamp: if empty, send empty string; if filled, convert to number
      if (paramValue === '') {
        params.push({ name: paramName, value: '' });
      } else {
        params.push({ name: paramName, value: parseInt(paramValue) });
      }
    } else {
      // Other parameters: always include if enabled, even if empty
      params.push({ name: paramName, value: paramValue });
    }
  });
  
  return params; // Don't filter out empty values anymore
}

/**
 * Build JSON object from parameters
 */
function buildJsonObject(params) {
  const jsonObj = {};
  params.forEach(param => {
    jsonObj[param.name] = param.value;
  });
  return jsonObj;
}

/**
 * Focus และ highlight element ที่มี error
 */
function focusAndHighlightError(elementSelector) {
  const $element = $(elementSelector);
  
  if ($element.length > 0) {
    // Focus ไปที่ element
    $element.focus();
    
    // เพิ่ม class สำหรับ error styling
    $element.addClass('is-invalid');
    
    // Scroll ไปที่ element (ถ้าอยู่นอกหน้าจอ)
    $('html, body').animate({
      scrollTop: $element.offset().top - 100
    }, 300);
    
    // ลบ error class หลัง 3 วินาที
    setTimeout(() => {
      $element.removeClass('is-invalid');
    }, 3000);
    
    // หรือลบ error class เมื่อผู้ใช้เริ่มพิมพ์
    $element.one('input', function() {
      $(this).removeClass('is-invalid');
    });
  }
}

/**
 * Encrypt JSON string using AES
 */
function encryptWithAES(jsonString, secretKey, mode) {
  try {
    const keySize = parseInt($('#keySize').val());
    const keyBytes = keySize / 8; // Convert bits to bytes
    const outputFormat = $('#outputFormat').val();
    const customIV = $('#ivInput').val().trim();
    
    // Convert secret key to WordArray (support both string and hex)
    let key;
    if (secretKey.length === (keyBytes * 2) && /^[0-9a-fA-F]+$/.test(secretKey)) {
      // Hex key
      key = CryptoJS.enc.Hex.parse(secretKey);
    } else {
      // String key - pad or truncate to required key size
      const keyString = secretKey.padEnd(keyBytes, '0').substring(0, keyBytes);
      key = CryptoJS.enc.Utf8.parse(keyString);
    }
    
    // Handle IV
    let iv;
    if (customIV && customIV.length === 32 && /^[0-9a-fA-F]+$/.test(customIV)) {
      // Use custom IV if provided and valid
      iv = CryptoJS.enc.Hex.parse(customIV);
    } else {
      // Generate random IV (16 bytes for AES)
      iv = CryptoJS.lib.WordArray.random(16);
    }
    
    // Select encryption mode
    let cryptoMode;
    switch (mode.toUpperCase()) {
      case 'CBC':
        cryptoMode = CryptoJS.mode.CBC;
        break;
      case 'CFB':
        cryptoMode = CryptoJS.mode.CFB;
        break;
      case 'CTR':
        cryptoMode = CryptoJS.mode.CTR;
        break;
      case 'ECB':
        cryptoMode = CryptoJS.mode.ECB;
        break;
      case 'OFB':
        cryptoMode = CryptoJS.mode.OFB;
        break;
      default:
        cryptoMode = CryptoJS.mode.CBC;
    }
    
    // Encrypt the JSON string
    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
      iv: iv,
      mode: cryptoMode,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Format output based on selection
    let result;
    if (mode.toUpperCase() === 'ECB') {
      // For ECB mode, don't include IV
      if (outputFormat === 'hex') {
        result = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
      } else {
        result = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
      }
    } else {
      // For other modes, combine IV and encrypted data
      const combined = iv.concat(encrypted.ciphertext);
      if (outputFormat === 'hex') {
        result = combined.toString(CryptoJS.enc.Hex);
      } else {
        result = CryptoJS.enc.Base64.stringify(combined);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed: ' + error.message);
  }
}

/**
 * Build final BURT URL with encrypted parameters
 */
function buildBurtFinalUrl(encryptedKey) {
  const targetUrl = $('#targetUrl').val().trim();
  const appId = $('#appId').val().trim();
  
  // URL encode the encrypted key
  const encodedKey = encodeURIComponent(encryptedKey);
  
  return `${targetUrl}?application_id=${appId}&key=${encodedKey}`;
}

/**
 * Display BURT generation results
 */
function displayBurtResults(jsonString, encryptedKey, finalUrl, paramCount) {
  // Show result card
  $('#resultCard').show();
  
  // Update preview sections
  $('#jsonPreview').text(jsonString);
  $('#encryptedKey').text(encryptedKey);
  $('#finalUrl').val(finalUrl);
  
  // Update statistics
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  
  $('#paramCount').text(paramCount);
  $('#generatedTime').text(timeString);
  $('#keyLength').text(encryptedKey.length + ' chars');
  $('#urlLength').text(finalUrl.length + ' chars');
  
  // Scroll to results
  $('html, body').animate({
    scrollTop: $('#resultCard').offset().top - 100
  }, 500);
  
  console.log('BURT Results displayed successfully');
}

/**
 * Copy generated URL to clipboard
 */
function copyUrlToClipboard() {
  const finalUrl = $('#finalUrl').val();
  
  if (!finalUrl) {
    showNotification('No URL to copy', 'warning');
    return;
  }
  
  // Select and copy URL
  const urlInput = $('#finalUrl')[0];
  urlInput.select();
  urlInput.setSelectionRange(0, 99999); // For mobile devices
  
  try {
    document.execCommand('copy');
    showNotification('BURT Login URL copied to clipboard!', 'success');
  } catch (err) {
    console.error('Copy failed:', err);
    showNotification('Failed to copy URL. Please copy manually.', 'warning');
  }
}

/**
 * Copy JSON parameters to clipboard
 */
function copyJsonToClipboard() {
  const jsonString = $('#jsonPreview').text();
  
  if (!jsonString) {
    showNotification('No JSON to copy', 'warning');
    return;
  }
  
  try {
    // Create temporary textarea to copy JSON
    const tempTextarea = $('<textarea>');
    tempTextarea.val(jsonString);
    $('body').append(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    tempTextarea.remove();
    
    showNotification('JSON parameters copied to clipboard!', 'success');
  } catch (err) {
    console.error('Copy failed:', err);
    showNotification('Failed to copy JSON. Please copy manually.', 'warning');
  }
}

/**
 * Test generated URL by opening in new tab
 */
function testUrl() {
  const finalUrl = $('#finalUrl').val();
  
  if (!finalUrl) {
    showNotification('No URL to test', 'warning');
    return;
  }
  
  try {
    window.open(finalUrl, '_blank');
    showNotification('Opening BURT URL in new tab...', 'info');
  } catch (error) {
    console.error('Failed to open URL:', error);
    showNotification('Failed to open URL', 'danger');
  }
}

/**
 * Show notification using Bootstrap Notify (2 seconds duration) - Enhanced version
 */
function showNotification(message, type) {
  const icons = {
    'success': 'check-circle',
    'danger': 'exclamation-triangle',
    'warning': 'exclamation-circle',
    'info': 'info-circle'
  };
  
  const titles = {
    'success': 'Success!',
    'danger': 'Error!',
    'warning': 'Warning!',
    'info': 'Info'
  };
  
  // Check if $.notify is available
  if (typeof $.notify !== 'function') {
    console.warn('Bootstrap Notify not loaded, using fallback alert');
    alert(`${titles[type] || 'Notice'}: ${message}`);
    return;
  }
  
  try {
    // Create notification with enhanced settings
    const notification = $.notify({
      icon: `fas fa-${icons[type] || 'info-circle'}`,
      title: titles[type] || 'Notice',
      message: message
    }, {
      type: type || 'info',
      placement: {
        from: 'top',
        align: 'right'
      },
      time: 2000, // 2 seconds
      delay: 0,
      animate: {
        enter: 'animated fadeInRight',
        exit: 'animated fadeOutRight'
      },
      template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
                '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
                '<span data-notify="icon"></span> ' +
                '<span data-notify="title">{1}</span> ' +
                '<span data-notify="message">{2}</span>' +
                '</div>',
      // Force auto-dismiss
      allow_dismiss: true,
      newest_on_top: true,
      mouse_over: 'pause',
      spacing: 10,
      timer: 1000,
      url_target: '_blank',
      z_index: 10000
    });
    
    // Force hide after timeout (fallback)
    setTimeout(() => {
      try {
        if (notification && typeof notification.close === 'function') {
          notification.close();
        }
        // Additional cleanup - remove any lingering notifications
        $('.alert[data-notify="container"]').fadeOut(300, function() {
          $(this).remove();
        });
      } catch (e) {
        console.warn('Error closing notification:', e);
      }
    }, 2500); // 2.5 seconds (slightly longer than notify time)
    
  } catch (error) {
    console.error('Notification error:', error);
    // Fallback to simple alert
    alert(`${titles[type] || 'Notice'}: ${message}`);
  }
}

/**
 * Clear all notifications manually
 */
function clearAllNotifications() {
  try {
    // Remove all bootstrap notify containers
    $('.alert[data-notify="container"]').each(function() {
      $(this).fadeOut(200, function() {
        $(this).remove();
      });
    });
    
    // Remove any other notification containers that might be stuck
    $('.notifyjs-wrapper, .notifyjs-container').remove();
    
    console.log('All notifications cleared');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Alternative simple notification function (fallback)
 */
function showSimpleNotification(message, type, duration = 2000) {
  // Create simple notification element
  const notification = $(`
    <div class="simple-notification alert alert-${type}" style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      animation: slideInRight 0.3s ease;
    ">
      <button type="button" class="close" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
      <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
    </div>
  `);
  
  // Add to body
  $('body').append(notification);
  
  // Handle close button
  notification.find('.close').click(function() {
    notification.fadeOut(200, function() {
      $(this).remove();
    });
  });
  
  // Auto-hide after duration
  setTimeout(() => {
    notification.fadeOut(300, function() {
      $(this).remove();
    });
  }, duration);
}

/**
 * Utility function to format file sizes
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get current Unix timestamp
 */
function getCurrentUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert Unix timestamp to readable date
 */
function unixToReadableDate(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleString();
}

/**
 * Validate JSON format
 */
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Format JSON string for display
 */
function formatJsonString(jsonObj) {
  return JSON.stringify(jsonObj, null, 2);
}

/**
 * Test different parameter scenarios
 */
function testParameterScenarios() {
  console.log('=== Testing Parameter Scenarios ===');
  
  // Scenario 1: All enabled with values
  console.log('\n1. All enabled with values:');
  BURT_PARAMETER_DEFINITIONS.forEach(param => {
    $(`#toggle_${param.name}`).prop('checked', true);
    $(`#param_${param.name}`).val(param.defaultValue);
  });
  const scenario1 = getEnabledParameters();
  console.log('Result:', buildJsonObject(scenario1));
  
  // Scenario 2: Some enabled but empty
  console.log('\n2. Some enabled but empty:');
  $('#param_en').val(''); // Empty
  $('#param_username').val(''); // Empty
  const scenario2 = getEnabledParameters();
  console.log('Result:', buildJsonObject(scenario2));
  
  // Scenario 3: Mixed enabled/disabled
  console.log('\n3. Mixed enabled/disabled:');
  $('#toggle_bu_code').prop('checked', false); // Disabled
  $('#toggle_user_bu').prop('checked', false); // Disabled
  const scenario3 = getEnabledParameters();
  console.log('Result:', buildJsonObject(scenario3));
  
  console.log('\n=== Test Complete ===');
  console.log('Expected behavior:');
  console.log('- Disabled parameters: Not included in JSON');
  console.log('- Enabled + Empty: Included with empty string value');
  console.log('- Enabled + Filled: Included with actual value');
}

// Export functions for external use (if needed)
window.AutoLoginBurtGenerator = {
  generateCurrentTimestamp,
  generateBurtLoginUrl,
  debugBurtSystem,
  testParameterScenarios, // New test function
  generateRandomIV,
  encryptWithAES,
  // Utility functions
  getCurrentUnixTimestamp,
  unixToReadableDate,
  isValidJson,
  formatJsonString,
  // Debug helpers
  clearAllNotifications,
  showSimpleNotification
}