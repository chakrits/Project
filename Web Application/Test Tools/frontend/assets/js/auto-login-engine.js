/**
 * Auto Login Engine - Shared logic for all auto-login URL generator forms
 * Author: Chakrit Salaeman & Claude
 *
 * Usage: call initAutoLoginForm({ parameters: [...] }) from a form config script.
 * HTML must load this file before the form config script.
 */

window.initAutoLoginForm = function (config) {
  const PARAMETER_DEFINITIONS = config.parameters;

  // ─── Utility ────────────────────────────────────────────

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function getTodayAt8AM() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T08:00`;
  }

  function convertToRequiredFormat(datetimeLocalValue) {
    if (datetimeLocalValue && !datetimeLocalValue.includes(":ss")) {
      return datetimeLocalValue + ":00";
    }
    return datetimeLocalValue;
  }

  // ─── Initialisation ─────────────────────────────────────

  function initializeAESModes() {
    const aesModeSelect = $("#aesMode");
    aesModeSelect.empty();
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
    aesModeSelect.val("ECB");
  }

  function initializeParameterForm() {
    const parametersContainer = $("#parametersForm");
    parametersContainer.empty();

    const leftColumn = $('<div class="col-md-6 parameters-column"></div>');
    const rightColumn = $('<div class="col-md-6 parameters-column"></div>');

    PARAMETER_DEFINITIONS.forEach((param, index) => {
      const parameterGroup = createParameterGroup(param);
      if (index % 2 === 0) {
        leftColumn.append(parameterGroup);
      } else {
        rightColumn.append(parameterGroup);
      }
    });

    const rowContainer = $('<div class="row parameters-row"></div>');
    rowContainer.append(leftColumn);
    rowContainer.append(rightColumn);
    parametersContainer.append(rowContainer);
  }

  function createParameterGroup(param) {
    const autoFillButton = param.autoFill ? createAutoFillButton(param) : "";
    return `
      <div class="parameter-group ${param.enabled ? "enabled" : "disabled"}">
        <div class="parameter-header">
          <div class="form-check form-switch">
            <input class="form-check-input param-toggle" type="checkbox"
                   id="toggle_${param.name}" ${param.enabled ? "checked" : ""}>
            <label class="form-check-label param-label" for="toggle_${param.name}">
              <strong>${param.name}</strong> <span class="text-muted">(${param.label})</span>
            </label>
          </div>
          ${autoFillButton}
        </div>
        <div class="parameter-input">
          <input type="${param.type}" class="form-control param-input"
                 id="param_${param.name}"
                 placeholder="${param.defaultValue || "Enter " + param.label.toLowerCase()}"
                 value="${param.defaultValue}"
                 ${param.enabled ? "" : "disabled"}>
        </div>
      </div>
    `;
  }

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

  function setInitialDateTimeValues() {
    PARAMETER_DEFINITIONS.forEach((param) => {
      if (!param.autoFill) return;
      const val = param.autoFill === "now" ? getCurrentDateTime() : getTodayAt8AM();
      $(`#param_${param.name}`).val(val);
    });
  }

  function updateEnabledCount() {
    const enabledCount = $(".param-toggle:checked").length;
    $("#enabledCount").text(enabledCount);
  }

  // ─── Event Handlers ──────────────────────────────────────

  function initializeEventHandlers() {
    $(document).on("change", ".param-toggle", handleParameterToggle);
    $(document).on("click", ".auto-fill-btn", handleAutoFill);
    $("#enableAllBtn").on("click", enableAllParameters);
    $("#disableAllBtn").on("click", disableAllParameters);
    $("#resetFormBtn").on("click", resetForm);
    $("#generateIvBtn").on("click", generateRandomIV);
    $("#generateUrlBtn").on("click", generateAutoLoginUrl);
    $("#copyUrlBtn").on("click", copyUrlToClipboard);
    $("#testUrlBtn").on("click", testUrl);
  }

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

  function handleAutoFill() {
    const targetId = $(this).data("target");
    const fillType = $(this).data("fill-type");
    const fillValue = fillType === "now" ? getCurrentDateTime() : getTodayAt8AM();
    $(`#${targetId}`).val(fillValue);
    showNotification("Auto-filled with current time", "success");
  }

  function enableAllParameters() {
    $(".param-toggle").prop("checked", true).trigger("change");
    showNotification("All parameters enabled", "success");
  }

  function disableAllParameters() {
    $(".param-toggle").prop("checked", false).trigger("change");
    showNotification("All parameters disabled", "warning");
  }

  function resetForm() {
    PARAMETER_DEFINITIONS.forEach((param) => {
      $(`#param_${param.name}`).val(param.defaultValue);
      $(`#toggle_${param.name}`).prop("checked", param.enabled).trigger("change");
    });
    setInitialDateTimeValues();
    $("#resultCard").hide();
    showNotification("Form reset to default values", "info");
  }

  function generateRandomIV() {
    try {
      const hexIV = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
      $("#ivInput").val(hexIV);
      showNotification("Random IV generated successfully", "success");
    } catch (error) {
      showNotification("Failed to generate IV: " + error.message, "danger");
    }
  }

  // ─── Parameters ──────────────────────────────────────────

  function getEnabledParameters() {
    const params = [];
    $(".param-toggle:checked").each(function () {
      const paramName = this.id.replace("toggle_", "");
      const paramValue = $(`#param_${paramName}`).val().trim();
      if (paramName.includes("datetime") || paramName === "created") {
        params.push({ name: paramName, value: paramValue ? convertToRequiredFormat(paramValue) : "" });
      } else {
        params.push({ name: paramName, value: paramValue });
      }
    });
    return params;
  }

  function buildQueryString(params) {
    return params.map((p) => `${p.name}=${p.value}`).join("&");
  }

  // ─── Encryption ──────────────────────────────────────────

  function encryptWithAES(queryString, secretKey, mode) {
    const keySize = parseInt($("#keySize").val());
    const keyBytes = keySize / 8;
    const outputFormat = $("#outputFormat").val();
    const customIV = $("#ivInput").val().trim();

    let key;
    if (secretKey.length === keyBytes * 2 && /^[0-9a-fA-F]+$/.test(secretKey)) {
      key = CryptoJS.enc.Hex.parse(secretKey);
    } else {
      const keyString = secretKey.padEnd(keyBytes, "0").substring(0, keyBytes);
      key = CryptoJS.enc.Utf8.parse(keyString);
    }

    let iv;
    if (customIV && customIV.length === 32 && /^[0-9a-fA-F]+$/.test(customIV)) {
      iv = CryptoJS.enc.Hex.parse(customIV);
    } else {
      iv = CryptoJS.lib.WordArray.random(16);
    }

    let cryptoMode;
    switch (mode.toUpperCase()) {
      case "CBC": cryptoMode = CryptoJS.mode.CBC; break;
      case "CFB": cryptoMode = CryptoJS.mode.CFB; break;
      case "CTR": cryptoMode = CryptoJS.mode.CTR; break;
      case "ECB": cryptoMode = CryptoJS.mode.ECB; break;
      case "OFB": cryptoMode = CryptoJS.mode.OFB; break;
      default:    cryptoMode = CryptoJS.mode.CBC;
    }

    const encrypted = CryptoJS.AES.encrypt(queryString, key, {
      iv: iv,
      mode: cryptoMode,
      padding: CryptoJS.pad.Pkcs7,
    });

    if (mode.toUpperCase() === "ECB") {
      return outputFormat === "hex"
        ? encrypted.ciphertext.toString(CryptoJS.enc.Hex)
        : CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
    } else {
      const combined = iv.concat(encrypted.ciphertext);
      return outputFormat === "hex"
        ? combined.toString(CryptoJS.enc.Hex)
        : CryptoJS.enc.Base64.stringify(combined);
    }
  }

  // ─── URL Building ────────────────────────────────────────

  function buildFinalUrl(encryptedKey) {
    const targetUrl = $("#targetUrl").val().trim();
    const orgCode = $("#orgCode").val().trim();
    const appId = $("#appId").val().trim();
    const encodedKey = encodeURIComponent(encryptedKey);
    return `${targetUrl}?org_code=${encodeURIComponent(orgCode)}&app_id=${encodeURIComponent(appId)}&key=${encodedKey}`;
  }

  // ─── Validation ──────────────────────────────────────────

  function validateInputs() {
    const targetUrl = $("#targetUrl").val().trim();
    const orgCode = $("#orgCode").val().trim();
    const appId = $("#appId").val().trim();
    const secretKey = $("#secretKey").val().trim();
    const customIV = $("#ivInput").val().trim();

    if (!targetUrl) return { isValid: false, message: "Target URL is required", focusElement: "#targetUrl" };
    try { new URL(targetUrl); } catch { return { isValid: false, message: "Please enter a valid URL", focusElement: "#targetUrl" }; }
    if (!orgCode) return { isValid: false, message: "Organization Code is required", focusElement: "#orgCode" };
    if (!appId) return { isValid: false, message: "Application ID is required", focusElement: "#appId" };
    if (!secretKey) return { isValid: false, message: "Secret Key is required", focusElement: "#secretKey" };
    if (secretKey.length < 8) return { isValid: false, message: "Secret Key must be at least 8 characters long", focusElement: "#secretKey" };
    if (customIV && (customIV.length !== 32 || !/^[0-9a-fA-F]+$/.test(customIV))) {
      return { isValid: false, message: "IV must be 32 hexadecimal characters (16 bytes)", focusElement: "#ivInput" };
    }
    return { isValid: true };
  }

  function focusAndHighlightError(elementSelector) {
    const $el = $(elementSelector);
    if (!$el.length) return;
    $el.focus().addClass("is-invalid");
    $("html, body").animate({ scrollTop: $el.offset().top - 100 }, 300);
    setTimeout(() => $el.removeClass("is-invalid"), 3000);
    $el.one("input", function () { $(this).removeClass("is-invalid"); });
  }

  // ─── Generate ────────────────────────────────────────────

  async function generateAutoLoginUrl() {
    try {
      const validation = validateInputs();
      if (!validation.isValid) {
        showNotification(validation.message, "danger");
        if (validation.focusElement) focusAndHighlightError(validation.focusElement);
        return;
      }

      const enabledParams = getEnabledParameters();
      if (enabledParams.length === 0) {
        showNotification("Please enable at least one parameter", "warning");
        return;
      }

      const generateBtn = $("#generateUrlBtn");
      const originalHtml = generateBtn.html();
      generateBtn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin me-2"></i>Generating...');

      const queryString = buildQueryString(enabledParams);
      const secretKey = $("#secretKey").val().trim();
      const aesMode = $("#aesMode").val();
      const encryptedKey = encryptWithAES(queryString, secretKey, aesMode);
      const finalUrl = buildFinalUrl(encryptedKey);

      displayResults(queryString, encryptedKey, finalUrl, enabledParams.length);
      showNotification("Auto Login URL generated successfully!", "success");
    } catch (error) {
      console.error("Generation error:", error);
      showNotification("Error generating URL: " + error.message, "danger");
    } finally {
      $("#generateUrlBtn").prop("disabled", false).html('<i class="fas fa-link me-2"></i>Generate Auto Login URL');
    }
  }

  // ─── Display ─────────────────────────────────────────────

  function displayResults(queryString, encryptedKey, finalUrl, paramCount) {
    $("#resultCard").show();
    $("#queryPreview").text(queryString);
    $("#encryptedKey").text(encryptedKey);
    $("#finalUrl").val(finalUrl);
    $("#paramCount").text(paramCount);
    $("#generatedTime").text(new Date().toLocaleTimeString());
    $("#keyLength").text(encryptedKey.length + " chars");
    $("#urlLength").text(finalUrl.length + " chars");
    $("html, body").animate({ scrollTop: $("#resultCard").offset().top - 100 }, 500);
  }

  function copyUrlToClipboard() {
    const finalUrl = $("#finalUrl").val();
    if (!finalUrl) { showNotification("No URL to copy", "warning"); return; }
    const urlInput = $("#finalUrl")[0];
    urlInput.select();
    urlInput.setSelectionRange(0, 99999);
    try {
      document.execCommand("copy");
      showNotification("Auto Login URL copied to clipboard!", "success");
    } catch (err) {
      showNotification("Failed to copy URL. Please copy manually.", "warning");
    }
  }

  function testUrl() {
    const finalUrl = $("#finalUrl").val();
    if (!finalUrl) { showNotification("No URL to test", "warning"); return; }
    try {
      window.open(finalUrl, "_blank");
      showNotification("Opening URL in new tab...", "info");
    } catch (error) {
      showNotification("Failed to open URL", "danger");
    }
  }

  // ─── Notifications ───────────────────────────────────────

  function showNotification(message, type) {
    const icons  = { success: "check-circle", danger: "exclamation-triangle", warning: "exclamation-circle", info: "info-circle" };
    const titles = { success: "Success!", danger: "Error!", warning: "Warning!", info: "Info" };

    if (typeof $.notify !== "function") {
      alert(`${titles[type] || "Notice"}: ${message}`);
      return;
    }

    try {
      const notification = $.notify(
        { icon: `fas fa-${icons[type] || "info-circle"}`, title: titles[type] || "Notice", message },
        {
          type: type || "info",
          placement: { from: "top", align: "right" },
          time: 2000,
          delay: 0,
          animate: { enter: "animated fadeInRight", exit: "animated fadeOutRight" },
          template:
            '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
            '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
            '<span data-notify="icon"></span> ' +
            '<span data-notify="title">{1}</span> ' +
            '<span data-notify="message">{2}</span></div>',
          allow_dismiss: true,
          newest_on_top: true,
          mouse_over: "pause",
          spacing: 10,
          timer: 1000,
          z_index: 10000,
        }
      );
      setTimeout(() => {
        try {
          if (notification && typeof notification.close === "function") notification.close();
          $('.alert[data-notify="container"]').fadeOut(300, function () { $(this).remove(); });
        } catch (e) {}
      }, 2500);
    } catch (error) {
      alert(`${titles[type] || "Notice"}: ${message}`);
    }
  }

  // ─── Boot ────────────────────────────────────────────────

  $(document).ready(function () {
    if (typeof CryptoJS === "undefined") {
      showNotification("CryptoJS library not loaded. Encryption will not work.", "danger");
    }
    initializeParameterForm();
    initializeEventHandlers();
    initializeAESModes();
    setInitialDateTimeValues();
    updateEnabledCount();
  });

  // Expose for debugging
  window.AutoLoginGenerator = {
    getCurrentDateTime,
    getTodayAt8AM,
    generateAutoLoginUrl,
    generateRandomIV,
    encryptWithAES,
  };
};
