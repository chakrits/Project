/**
 * Utility function to format file sizes
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
/**
 * Auto Login Form Generator - JavaScript Logic & Functions
 * Author: Chakrit Salaeman & Claude
 * Description: Handles all logic for generating encrypted auto-login URLs
 */

// Global variables
let systemConfig = null;
let currentParams = [];

// Parameter definitions with default values
const PARAMETER_DEFINITIONS = [
  {
    name: "sc",
    label: "Screen Page - Mandatory",
    type: "text",
    defaultValue: "/digitsign/gen_fast_track",
    enabled: true,
  },
  {
    name: "bu_code",
    label: "Business Unit Code - Mandatory",
    type: "text",
    defaultValue: "005",
    enabled: true,
  },
  {
    name: "requested_datetime",
    label: "Request DateTime - Mandatory",
    type: "datetime-local",
    defaultValue: "",
    enabled: true,
    autoFill: "now",
  },
  {
    name: "clinic_location",
    label: "Clinic Location",
    type: "text",
    defaultValue: "",
    enabled: false,
  },
  {
    name: "created",
    label: "Created DateTime - Mandatory",
    type: "datetime-local",
    defaultValue: "",
    enabled: true,
    autoFill: "now",
  },
  {
    name: "template_code",
    label: "Template Code",
    type: "text",
    defaultValue: "claim_fast_track",
    enabled: true,
  },
  {
    name: "request_id",
    label: "Request ID",
    type: "text",
    defaultValue: "28",
    enabled: true,
  },
  {
    name: "action",
    label: "Action - Mandatory",
    type: "text",
    defaultValue: "gen_fast_track",
    enabled: true,
  },
  {
    name: "download_password",
    label: "Download Password",
    type: "password",
    defaultValue: "123456",
    enabled: false,
  },
  {
    name: "open_file_password",
    label: "Open File Password",
    type: "password",
    defaultValue: "123456",
    enabled: false,
  },
  {
    name: "appointmant_id",
    label: "Appointment ID",
    type: "text",
    defaultValue: "appointment001",
    enabled: false,
  },
  {
    name: "hn",
    label: "Hospital Number - Mandatory",
    type: "text",
    defaultValue: "05-24-021566",
    enabled: true,
  },
  {
    name: "patient_row_id",
    label: "Patient Row ID",
    type: "number",
    defaultValue: "936346",
    enabled: true,
  },
  {
    name: "en",
    label: "Encounter Number - Mandatory",
    type: "text",
    defaultValue: "O05-25-143267",
    enabled: true,
  },
  {
    name: "encounter_row_id",
    label: "Encounter Row ID",
    type: "number",
    defaultValue: "2076966",
    enabled: true,
  },
  {
    name: "visit_datetime",
    label: "Visit DateTime",
    type: "datetime-local",
    defaultValue: "",
    enabled: true,
    autoFill: "today8am",
  },
    {
    name: "discharge_datetime",
    label: "Discharge DateTime",
    type: "datetime-local",
    defaultValue: "",
    enabled: true,
    autoFill: "",
  },
 {
    name: "payor_office_code",
    label: "Payor Office Code",
    type: "number",
    defaultValue: "9000714003",
    enabled: true,
  },
   {
    name: "total_hospital_expenses",
    label: "Total Hospital Expenses",
    type: "number",
    defaultValue: "1500",
    enabled: true,
  },
  {
    name: "requested_user",
    label: "Requested User - Mandatory",
    type: "text",
    defaultValue: "Chakrit.Sa",
    enabled: true,
  }
];

/**
 * Initialize the application when DOM is ready
 */
$(document).ready(function () {
  console.log("Auto Login Form Generator - Initializing...");

  // ตรวจสอบว่า CryptoJS โหลดสำเร็จหรือไม่
  if (typeof CryptoJS !== 'undefined') {
    console.log('✅ CryptoJS loaded successfully from local file');
    console.log('CryptoJS version:', CryptoJS.lib.WordArray ? 'Available' : 'Error');
  } else {
    console.error('❌ CryptoJS failed to load');
    showNotification('CryptoJS library not loaded. Encryption will not work.', 'danger');
  }

  // Initialize form components
  initializeParameterForm();
  initializeEventHandlers();
  initializeAESModes();
  setInitialDateTimeValues();
  updateEnabledCount();

  console.log("Auto Login Form Generator - Ready!");
});

/**
 * Initialize AES modes dropdown
 */
function initializeAESModes() {
  const aesModeSelect = $("#aesMode");
  aesModeSelect.empty();

  // Add AES modes similar to AES encryption form
  const modes = [
    { value: "CBC", text: "CBC - Cipher Block Chaining" },
    { value: "CFB", text: "CFB - Cipher Feedback" },
    { value: "CTR", text: "CTR - Counter" },
    { value: "ECB", text: "ECB - Electronic Codebook" },
    { value: "OFB", text: "OFB - Output Feedback" },
  ];

  modes.forEach((mode) => {
    aesModeSelect.append(`<option value="${mode.value}">${mode.text}</option>`);
  });

  // Set default to ECB
  aesModeSelect.val("ECB");
}

/**
 * Generate parameter form dynamically based on definitions (2 columns layout)
 */
function initializeParameterForm() {
  const parametersContainer = $("#parametersForm");
  parametersContainer.empty();

  // Create 2-column layout
  const leftColumn = $('<div class="col-md-6 parameters-column"></div>');
  const rightColumn = $('<div class="col-md-6 parameters-column"></div>');

  PARAMETER_DEFINITIONS.forEach((param, index) => {
    const parameterGroup = createParameterGroup(param);

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
 * Create individual parameter group HTML
 */
function createParameterGroup(param) {
  const autoFillButton = param.autoFill ? createAutoFillButton(param) : "";

  return `
    <div class="parameter-group ${param.enabled ? "enabled" : "disabled"}">
      <div class="parameter-header">
        <div class="form-check form-switch">
          <input class="form-check-input param-toggle" type="checkbox" 
                 id="toggle_${param.name}" ${param.enabled ? "checked" : ""}>
          <label class="form-check-label param-label" for="toggle_${
            param.name
          }">
            <strong>${param.name}</strong> <span class="text-muted">(${
    param.label
  })</span>
          </label>
        </div>
        ${autoFillButton}
      </div>
      <div class="parameter-input">
        <input type="${param.type}" class="form-control param-input" 
               id="param_${param.name}" 
               placeholder="${
                 param.defaultValue || "Enter " + param.label.toLowerCase()
               }" 
               value="${param.defaultValue}"
               ${param.enabled ? "" : "disabled"}>
      </div>
    </div>
  `;
}

/**
 * Create auto-fill button for datetime fields
 */
function createAutoFillButton(param) {
  const buttonText = param.autoFill === "now" ? "Now" : "Today 8AM";
  const iconClass = param.autoFill === "now" ? "clock" : "calendar";

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
  $(document).on("change", ".param-toggle", handleParameterToggle);

  // Auto-fill buttons
  $(document).on("click", ".auto-fill-btn", handleAutoFill);

  // Bulk action buttons
  $("#enableAllBtn").on("click", enableAllParameters);
  $("#disableAllBtn").on("click", disableAllParameters);
  $("#resetFormBtn").on("click", resetForm);

  // IV generation button
  $("#generateIvBtn").on("click", generateRandomIV);

  // Generation and action buttons
  $("#generateUrlBtn").on("click", generateAutoLoginUrl);
  $("#copyUrlBtn").on("click", copyUrlToClipboard);
  $("#testUrlBtn").on("click", testUrl);
}

/**
 * Handle parameter toggle switch changes
 */
function handleParameterToggle() {
  const targetId = this.id.replace("toggle_", "param_");
  const targetInput = $(`#${targetId}`);
  const parameterGroup = $(this).closest(".parameter-group");

  if (this.checked) {
    targetInput.prop("disabled", false);
    parameterGroup.removeClass("disabled").addClass("enabled");
  } else {
    targetInput.prop("disabled", true);
    parameterGroup.removeClass("enabled").addClass("disabled");
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

    $("#ivInput").val(hexIV);
    showNotification("Random IV generated successfully", "success");
  } catch (error) {
    console.error("IV generation error:", error);
    showNotification("Failed to generate IV: " + error.message, "danger");
  }
}

/**
 * Handle auto-fill button clicks
 */
function handleAutoFill() {
  const targetId = $(this).data("target");
  const fillType = $(this).data("fill-type");
  const targetInput = $(`#${targetId}`);

  let fillValue = "";

  switch (fillType) {
    case "now":
      fillValue = getCurrentDateTime();
      break;
    case "today8am":
      fillValue = getTodayAt8AM();
      break;
  }

  targetInput.val(fillValue);
  showNotification("Auto-filled with current time", "success");
}

/**
 * Get current date time in required format
 */
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get today's date at 8 AM
 */
function getTodayAt8AM() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}T08:00`;
}

/**
 * Set initial datetime values
 */
function setInitialDateTimeValues() {
  const now = getCurrentDateTime();
  const today8AM = getTodayAt8AM();

  $("#param_requested_datetime").val(now);
  $("#param_created").val(now);
  $("#param_visit_datetime").val(today8AM);
}

/**
 * Update enabled parameters counter
 */
function updateEnabledCount() {
  const enabledCount = $(".param-toggle:checked").length;
  $("#enabledCount").text(enabledCount);
}

/**
 * Enable all parameters
 */
function enableAllParameters() {
  $(".param-toggle").prop("checked", true).trigger("change");
  showNotification("All parameters enabled", "success");
}

/**
 * Disable all parameters
 */
function disableAllParameters() {
  $(".param-toggle").prop("checked", false).trigger("change");
  showNotification("All parameters disabled", "warning");
}

/**
 * Reset form to default values
 */
function resetForm() {
  // Reset all input values to defaults
  PARAMETER_DEFINITIONS.forEach((param) => {
    const input = $(`#param_${param.name}`);
    input.val(param.defaultValue);

    // Reset toggle states
    const toggle = $(`#toggle_${param.name}`);
    toggle.prop("checked", param.enabled).trigger("change");
  });

  // Reset datetime fields
  setInitialDateTimeValues();

  // Hide result card
  $("#resultCard").hide();

  showNotification("Form reset to default values", "info");
}

/**
 * Generate auto login URL with AES encryption
 */
async function generateAutoLoginUrl() {
  try {
    // Validate inputs
    const validation = validateInputs();
    if (!validation.isValid) {
      showNotification(validation.message, "danger");

      // เพิ่ม - Focus และ highlight error field
      if (validation.focusElement) {
        focusAndHighlightError(validation.focusElement);
      }

      return;
    }

    // Get enabled parameters
    const enabledParams = getEnabledParameters();
    if (enabledParams.length === 0) {
      showNotification("Please enable at least one parameter", "warning");
      return;
    }

    // Show generating state
    const generateBtn = $("#generateUrlBtn");
    const originalText = generateBtn.html();
    generateBtn
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin me-2"></i>Generating...');

    // Build query string
    const queryString = buildQueryString(enabledParams);
    console.log("Query string:", queryString);

    // Encrypt the query string
    const secretKey = $("#secretKey").val().trim();
    const aesMode = $("#aesMode").val();
    const encryptedKey = encryptWithAES(queryString, secretKey, aesMode);
    console.log("Encrypted key:", encryptedKey);

    // Build final URL
    const finalUrl = buildFinalUrl(encryptedKey);
    console.log("Final URL:", finalUrl);

    // Display results
    displayResults(queryString, encryptedKey, finalUrl, enabledParams.length);

    showNotification("Auto Login URL generated successfully!", "success");
  } catch (error) {
    console.error("Generation error:", error);
    showNotification("Error generating URL: " + error.message, "danger");
  } finally {
    // Restore button state
    const generateBtn = $("#generateUrlBtn");
    generateBtn
      .prop("disabled", false)
      .html('<i class="fas fa-link me-2"></i>Generate Auto Login URL');
  }
}

/**
 * Validate form inputs
 */
function validateInputs() {
  const targetUrl = $("#targetUrl").val().trim();
  const orgCode = $("#orgCode").val().trim();
  const appId = $("#appId").val().trim();
  const secretKey = $("#secretKey").val().trim();
  const customIV = $("#ivInput").val().trim();

  if (!targetUrl) {
    return { isValid: false, message: "Target URL is required", focusElement: '#targetUrl' };
  }

  // Validate URL format
  try {
    new URL(targetUrl);
  } catch {
    return { isValid: false, message: "Please enter a valid URL", focusElement: '#targetUrl' };
  }

  if (!orgCode) {
    return { isValid: false, message: "Organization Code is required" , focusElement: '#orgCode'};
  }

  if (!appId) {
    return { isValid: false, message: "Application ID is required", focusElement: '#appId' };
  }

  if (!secretKey) {
    return { isValid: false, message: "Secret Key is required", focusElement: '#secretKey' };
  }

  if (secretKey.length < 8) {
    return {
      isValid: false,
      message: "Secret Key must be at least 8 characters long",
      focusElement: '#secretKey'
    };
  }

  // Validate IV if provided
  if (
    customIV &&
    (customIV.length !== 32 || !/^[0-9a-fA-F]+$/.test(customIV))
  ) {
    return {
      isValid: false,
      message: "IV must be 32 hexadecimal characters (16 bytes)",
      focusElement: '#ivInput'
    };
  }

  return { isValid: true };
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
 * Get enabled parameters with their values
 */
function getEnabledParameters() {
  const params = [];

  $(".param-toggle:checked").each(function () {
    const paramName = this.id.replace("toggle_", "");
    const paramValue = $(`#param_${paramName}`).val().trim();

    // Convert datetime-local to required format
    if (paramName.includes("datetime") || paramName === "created") {
      if (paramValue) {
        const formattedDateTime = convertToRequiredFormat(paramValue);
        params.push({ name: paramName, value: formattedDateTime });
      }
      else {
        // ถ้าเป็น field วันที่และไม่ได้กรอก ให้ส่งค่าว่าง
        params.push({ name: paramName, value: '' });
      }
    } 
    else {
      // สำหรับ parameter อื่นๆ ส่งค่าตามที่กรอก (รวมถึงค่าว่าง)
      params.push({ name: paramName, value: paramValue });
    }
  });

  //return params.filter((p) => p.value !== ""); // Filter out empty values
  return params; // ส่งคืนทุก parameter ที่ enable แม้จะมีค่าว่าง
}

/**
 * Build query string from parameters (รองรับค่าว่าง)
 */
function buildQueryString(params) {
  return params.map(p => `${p.name}=${p.value}`).join('&');
}

/**
 * Convert datetime-local format to required format
 */
function convertToRequiredFormat(datetimeLocalValue) {
  // Convert from YYYY-MM-DDTHH:mm to YYYY-MM-DDTHH:mm:ss
  if (datetimeLocalValue && !datetimeLocalValue.includes(":ss")) {
    return datetimeLocalValue + ":00";
  }
  return datetimeLocalValue;
}

/**
 * Build query string from parameters (without URI encoding)
 */
function buildQueryString(params) {
  return params.map((p) => `${p.name}=${p.value}`).join("&");
}

/**
 * Encrypt query string using AES (improved with IV and key size support)
 */
function encryptWithAES(queryString, secretKey, mode) {
  try {
    const keySize = parseInt($("#keySize").val());
    const keyBytes = keySize / 8; // Convert bits to bytes
    const outputFormat = $("#outputFormat").val();
    const customIV = $("#ivInput").val().trim();

    // Convert secret key to WordArray (support both string and hex)
    let key;
    if (secretKey.length === keyBytes * 2 && /^[0-9a-fA-F]+$/.test(secretKey)) {
      // Hex key
      key = CryptoJS.enc.Hex.parse(secretKey);
    } else {
      // String key - pad or truncate to required key size
      const keyString = secretKey.padEnd(keyBytes, "0").substring(0, keyBytes);
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
      case "CBC":
        cryptoMode = CryptoJS.mode.CBC;
        break;
      case "CFB":
        cryptoMode = CryptoJS.mode.CFB;
        break;
      case "CTR":
        cryptoMode = CryptoJS.mode.CTR;
        break;
      case "ECB":
        cryptoMode = CryptoJS.mode.ECB;
        break;
      case "OFB":
        cryptoMode = CryptoJS.mode.OFB;
        break;
      default:
        cryptoMode = CryptoJS.mode.CBC;
    }

    // Encrypt the query string
    const encrypted = CryptoJS.AES.encrypt(queryString, key, {
      iv: iv,
      mode: cryptoMode,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Format output based on selection
    let result;
    if (mode.toUpperCase() === "ECB") {
      // For ECB mode, don't include IV
      if (outputFormat === "hex") {
        result = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
      } else {
        result = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
      }
    } else {
      // For other modes, combine IV and encrypted data
      const combined = iv.concat(encrypted.ciphertext);
      if (outputFormat === "hex") {
        result = combined.toString(CryptoJS.enc.Hex);
      } else {
        result = CryptoJS.enc.Base64.stringify(combined);
      }
    }

    return result;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Encryption failed: " + error.message);
  }
}

/**
 * Build final URL with encrypted parameters
 */
function buildFinalUrl(encryptedKey) {
  const targetUrl = $("#targetUrl").val().trim();
  const orgCode = $("#orgCode").val().trim();
  const appId = $("#appId").val().trim();

  // URL encode the encrypted key
  const encodedKey = encryptedKey;

  return `${targetUrl}?org_code=${orgCode}&app_id=${appId}&key=${encodedKey}`;
}

/**
 * Display generation results
 */
function displayResults(queryString, encryptedKey, finalUrl, paramCount) {
  // Show result card
  $("#resultCard").show();

  // เพิ่มส่วนนี้เพื่อสร้าง JSON object สำหรับแสดงผล
  const queryParams = queryString.split('&').reduce((obj, item) => {
    const [key, value] = item.split('=');
    obj[key] = value;
    return obj;
  }, {});

  // Format JSON string for display
  const prettyJson = JSON.stringify(queryParams, null, 2);

  // Update preview sections
  $("#queryPreview").text(queryString);
  $("#encryptedKey").text(encryptedKey);
  $("#finalUrl").val(finalUrl);

  // Update statistics
  const now = new Date();
  const timeString = now.toLocaleTimeString();

  $("#paramCount").text(paramCount);
  $("#generatedTime").text(timeString);
  $("#keyLength").text(encryptedKey.length + " chars");
  $("#urlLength").text(finalUrl.length + " chars");

  // Scroll to results
  $("html, body").animate(
    {
      scrollTop: $("#resultCard").offset().top - 100,
    },
    500
  );

  console.log("Results displayed successfully");
}

/**
 * Copy generated URL to clipboard
 */
function copyUrlToClipboard() {
  const finalUrl = $("#finalUrl").val();

  if (!finalUrl) {
    showNotification("No URL to copy", "warning");
    return;
  }

  // Select and copy URL
  const urlInput = $("#finalUrl")[0];
  urlInput.select();
  urlInput.setSelectionRange(0, 99999); // For mobile devices

  try {
    document.execCommand("copy");
    showNotification("Auto Login URL copied to clipboard!", "success");
  } catch (err) {
    console.error("Copy failed:", err);
    showNotification("Failed to copy URL. Please copy manually.", "warning");
  }
}

/**
 * Test generated URL by opening in new tab
 */
function testUrl() {
  const finalUrl = $("#finalUrl").val();

  if (!finalUrl) {
    showNotification("No URL to test", "warning");
    return;
  }

  try {
    window.open(finalUrl, "_blank");
    showNotification("Opening URL in new tab...", "info");
  } catch (error) {
    console.error("Failed to open URL:", error);
    showNotification("Failed to open URL", "danger");
  }
}

/**
 * Show notification using Bootstrap Notify (2 seconds duration) - Enhanced version
 */
function showNotification(message, type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
  };

  const titles = {
    success: "Success!",
    danger: "Error!",
    warning: "Warning!",
    info: "Info",
  };

  // Check if $.notify is available
  if (typeof $.notify !== "function") {
    console.warn("Bootstrap Notify not loaded, using fallback alert");
    alert(`${titles[type] || "Notice"}: ${message}`);
    return;
  }

  try {
    // Create notification with enhanced settings
    const notification = $.notify(
      {
        icon: `fas fa-${icons[type] || "info-circle"}`,
        title: titles[type] || "Notice",
        message: message,
      },
      {
        type: type || "info",
        placement: {
          from: "top",
          align: "right",
        },
        time: 2000, // 2 seconds
        delay: 0,
        animate: {
          enter: "animated fadeInRight",
          exit: "animated fadeOutRight",
        },
        template:
          '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
          '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
          '<span data-notify="icon"></span> ' +
          '<span data-notify="title">{1}</span> ' +
          '<span data-notify="message">{2}</span>' +
          "</div>",
        // Force auto-dismiss
        allow_dismiss: true,
        newest_on_top: true,
        mouse_over: "pause",
        spacing: 10,
        timer: 1000,
        url_target: "_blank",
        z_index: 10000,
      }
    );

    // Force hide after timeout (fallback)
    setTimeout(() => {
      try {
        if (notification && typeof notification.close === "function") {
          notification.close();
        }
        // Additional cleanup - remove any lingering notifications
        $('.alert[data-notify="container"]').fadeOut(300, function () {
          $(this).remove();
        });
      } catch (e) {
        console.warn("Error closing notification:", e);
      }
    }, 2500); // 2.5 seconds (slightly longer than notify time)
  } catch (error) {
    console.error("Notification error:", error);
    // Fallback to simple alert
    alert(`${titles[type] || "Notice"}: ${message}`);
  }
}

/**
 * Clear all notifications manually
 */
function clearAllNotifications() {
  try {
    // Remove all bootstrap notify containers
    $('.alert[data-notify="container"]').each(function () {
      $(this).fadeOut(200, function () {
        $(this).remove();
      });
    });

    // Remove any other notification containers that might be stuck
    $(".notifyjs-wrapper, .notifyjs-container").remove();

    console.log("All notifications cleared");
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
}

/**
 * Debug notification system
 */
function debugNotificationSystem() {
  console.log("=== Notification Debug Info ===");
  console.log("jQuery version:", $.fn.jquery);
  console.log("$.notify available:", typeof $.notify === "function");
  console.log(
    "Bootstrap Notify loaded:",
    typeof $.notifyDefaults !== "undefined"
  );
  console.log(
    "Current notifications:",
    $('.alert[data-notify="container"]').length
  );
  console.log("Notification elements:", $('.alert[data-notify="container"]'));
  console.log("===============================");
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
      <strong>${
        type.charAt(0).toUpperCase() + type.slice(1)
      }:</strong> ${message}
    </div>
  `);

  // Add to body
  $("body").append(notification);

  // Handle close button
  notification.find(".close").click(function () {
    notification.fadeOut(200, function () {
      $(this).remove();
    });
  });

  // Auto-hide after duration
  setTimeout(() => {
    notification.fadeOut(300, function () {
      $(this).remove();
    });
  }, duration);
}
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Debug function to log current state
 */
function debugCurrentState() {
  console.log("=== DEBUG: Current State ===");
  console.log("Enabled Parameters:", getEnabledParameters());
  console.log("Current URL:", $("#finalUrl").val());
  console.log("AES Mode:", $("#aesMode").val());
  console.log("Key Size:", $("#keySize").val());
  console.log("IV:", $("#ivInput").val());
  console.log("Output Format:", $("#outputFormat").val());
  console.log("===========================");
}

// Export functions for external use (if needed)
window.AutoLoginGenerator = {
  getCurrentDateTime,
  getTodayAt8AM,
  generateAutoLoginUrl,
  debugCurrentState,
  generateRandomIV,
  encryptWithAES,
  // Debug helpers
  clearAllNotifications,
  debugNotificationSystem,
  showSimpleNotification,
};
