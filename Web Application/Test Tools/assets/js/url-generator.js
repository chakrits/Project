/**
 * URL Generator - JavaScript Logic
 * สร้าง Encrypted Auto Login URL จาก JSON Payload
 */

// ค่า Default ของ Payload Parameters ตาม JSON spec
const PARAMETER_DEFINITIONS = [
  {
    name: "request_datetime",
    label: "Request DateTime",
    description: "เวลา +/- ได้ไม่เกิน 5 นาที",
    type: "datetime-local",
    defaultValue: "",
    autoFill: "now",
    enabled: true,
    mandatory: true,
  },
  {
    name: "request_username",
    label: "Request Username",
    description: "User ที่ใช้ในการทำ Auto Login",
    type: "text",
    defaultValue: "Chakrit.Sa",
    enabled: true,
    mandatory: true,
  },
  {
    name: "bu_code",
    label: "BU Code",
    description: "BU-Code สำหรับ site นั้นๆ",
    type: "text",
    defaultValue: "038",
    enabled: true,
    mandatory: true,
  },
  {
    name: "sc",
    label: "Screen Page",
    description: "Screen Page ที่ต้องการเข้าถึง",
    type: "text",
    defaultValue: "/edocsign/bud/document-list",
    enabled: true,
    mandatory: true,
  },
  {
    name: "action",
    label: "Action",
    description: "Function สำหรับการใช้งาน",
    type: "text",
    defaultValue: "search-document",
    enabled: true,
    mandatory: true,
  },
  {
    name: "correspondent_code",
    label: "Correspondent Code (HN)",
    description: "HN ที่ต้องการค้นหา",
    type: "text",
    defaultValue: "38-26-718394",
    enabled: true,
    mandatory: true,
  },
  {
    name: "correspondent_type",
    label: "Correspondent Type",
    description: "Fixed Value: patient",
    type: "select",
    options: ["patient"],
    defaultValue: "patient",
    enabled: true,
    mandatory: false,
  },
  {
    name: "correspondent_episode",
    label: "Correspondent Episode (EN)",
    description: "EN ที่ต้องการค้นหา",
    type: "text",
    defaultValue: "I38-26-718615",
    enabled: true,
    mandatory: true,
  },
  {
    name: "document_type_id",
    label: "Document Type ID",
    description: "เอกสารที่ต้องการค้นหา (Array 0001-0011)",
    type: "array",
    defaultValue: ["0005"],
    enabled: true,
    mandatory: false,
  },
  {
    name: "issuer_code",
    label: "Issuer Code",
    description: "Owner ในการส่งเอกสารมา Sign",
    type: "text",
    defaultValue: "econsent_application_bdms",
    enabled: false,
    mandatory: false,
  },
  {
    name: "issuer_code_type",
    label: "Issuer Code Type",
    description: "ประเภทของ Owner",
    type: "select",
    options: ["application_contact_code", "care_provider_code"],
    defaultValue: "application_contact_code",
    enabled: false,
    mandatory: false,
  },
  {
    name: "document_no",
    label: "Document No",
    description: "หมายเลขเอกสาร (invoice, statement, medical expense)",
    type: "text",
    defaultValue: "38-CO26773489",
    enabled: false,
    mandatory: false,
  },
  {
    name: "document_no_type_code",
    label: "Document No Type Code",
    description: "การใช้งานเอกสาร",
    type: "select",
    options: ["official", "internal"],
    defaultValue: "official",
    enabled: false,
    mandatory: false,
  },
  {
    name: "latest",
    label: "Latest",
    description: "การจัดเรียงเอกสาร sort",
    type: "select",
    options: ["true", "false"],
    defaultValue: "true",
    enabled: true,
    mandatory: false,
  },
];

let systemsConfig = [];

// ============================
// Initialize
// ============================
$(document).ready(function () {
  if (typeof CryptoJS === 'undefined') {
    showNotification('CryptoJS library not loaded. Encryption will not work.', 'danger');
  }

  loadSystemConfigs();
  initializeParameterForm();
  initializeEventHandlers();
  setInitialDateTimes();
  updateEnabledCount();
  handleAesModeChange();
});

// ============================
// System Config
// ============================
function loadSystemConfigs() {
  $.getJSON('../assets/config/systems-config.json')
    .done(function (data) {
      systemsConfig = data.systems;
      populateSystemDropdown();
    })
    .fail(function () {
      // silent — allow manual config
    });
}

function populateSystemDropdown() {
  const $dropdown = $('#systemSelect');
  $dropdown.find('option:not(:first)').remove();
  systemsConfig.forEach(function (sys) {
    $dropdown.append(`<option value="${sys.id}">${sys.name} (${sys.organization || ''})</option>`);
  });
}

// ============================
// Parameter Form
// ============================
function initializeParameterForm() {
  const container = $('#parametersForm');
  container.empty();

  const leftCol = $('<div class="col-md-6 parameters-column"></div>');
  const rightCol = $('<div class="col-md-6 parameters-column"></div>');

  PARAMETER_DEFINITIONS.forEach(function (param, idx) {
    const group = createParamGroup(param);
    if (idx % 2 === 0) leftCol.append(group);
    else rightCol.append(group);
  });

  const rowContainer = $('<div class="row parameters-row"></div>');
  rowContainer.append(leftCol).append(rightCol);
  container.append(rowContainer);
}

function createParamGroup(param) {
  const mandatoryBadge = param.mandatory ? '<span class="badge bg-danger ms-1" style="font-size:0.65rem;">Mandatory</span>' : '';
  const autoFillBtn = param.autoFill === 'now'
    ? `<button type="button" class="btn btn-sm btn-outline-primary auto-fill-btn" data-target="param_${param.name}" data-fill-type="now"><i class="fas fa-clock me-1"></i>Now</button>`
    : '';

  let inputHtml = '';
  if (param.type === 'select') {
    const opts = param.options.map(o => `<option value="${o}" ${o === param.defaultValue ? 'selected' : ''}>${o}</option>`).join('');
    inputHtml = `<select class="form-control param-input" id="param_${param.name}" ${param.enabled ? '' : 'disabled'}>${opts}</select>`;
  } else if (param.type === 'array') {
    const tagsHtml = (param.defaultValue || []).map(v => createTagHtml(v)).join('');
    inputHtml = `
      <div>
        <div class="array-tags-container" id="tags_${param.name}">${tagsHtml}</div>
        <div class="array-input-row">
          <input type="text" class="form-control form-control-sm array-new-input" id="param_${param.name}"
            placeholder="พิมพ์แล้วกด Enter หรือคลิก Add" ${param.enabled ? '' : 'disabled'} />
          <button type="button" class="btn btn-sm btn-outline-primary array-add-btn" data-target="${param.name}" ${param.enabled ? '' : 'disabled'}>
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <input type="hidden" id="array_value_${param.name}" data-type="array" />
      </div>`;
  } else {
    inputHtml = `<input type="${param.type === 'datetime-local' ? 'datetime-local' : 'text'}" class="form-control param-input" id="param_${param.name}"
      placeholder="${param.defaultValue || ''}" value="${param.type === 'datetime-local' ? '' : param.defaultValue}"
      ${param.enabled ? '' : 'disabled'} />`;
  }

  return `
    <div class="parameter-group ${param.enabled ? 'enabled' : 'disabled'}" id="group_${param.name}">
      <div class="parameter-header">
        <div class="form-check form-switch mb-0">
          <input class="form-check-input param-toggle" type="checkbox" id="toggle_${param.name}" ${param.enabled ? 'checked' : ''}>
          <label class="form-check-label param-label" for="toggle_${param.name}">
            <strong>${param.name}</strong>${mandatoryBadge}
            <br><small class="text-muted">${param.description}</small>
          </label>
        </div>
        ${autoFillBtn}
      </div>
      <div class="parameter-input mt-1">${inputHtml}</div>
    </div>`;
}

function createTagHtml(value) {
  return `<span class="array-tag">${value}<span class="remove-tag ms-1" data-value="${value}">×</span></span>`;
}

// Sync hidden input with tags for array type
function syncArrayHiddenInput(paramName) {
  const values = [];
  $(`#tags_${paramName} .array-tag`).each(function () {
    values.push($(this).text().replace('×', '').trim());
  });
  $(`#array_value_${paramName}`).val(JSON.stringify(values));
}

// ============================
// Event Handlers
// ============================
function initializeEventHandlers() {
  // System select
  $('#systemSelect').on('change', function () {
    const id = $(this).val();
    if (!id) {
      // Reset to default
      $('#targetUrl').val('');
      $('#appId').val('');
      $('#secretKey').val('');
      $('#aesMode').val('ECB');
      $('#keySize').val('128');
      $('#ivInput').val('');
      handleAesModeChange();
      return;
    }
    const sys = systemsConfig.find(s => s.id === id);
    if (!sys) return;

    if (sys.base_url) $('#targetUrl').val(sys.base_url);
    if (sys.app_id)   $('#appId').val(sys.app_id);
    if (sys.secret_key) $('#secretKey').val(sys.secret_key);
    if (sys.encryption_mode) $('#aesMode').val(sys.encryption_mode);
    if (sys.key_size) $('#keySize').val(String(sys.key_size));
    handleAesModeChange();

    showNotification(`Loaded config: ${sys.name}`, 'info');
  });

  // AES Mode — show/hide IV row
  $('#aesMode').on('change', handleAesModeChange);

  // Toggle show/hide secret key
  $('#toggleSecretKey').on('click', function () {
    const $input = $('#secretKey');
    const isPass = $input.attr('type') === 'password';
    $input.attr('type', isPass ? 'text' : 'password');
    $(this).find('i').toggleClass('fa-eye fa-eye-slash');
  });

  // Parameter toggles
  $(document).on('change', '.param-toggle', function () {
    const name = this.id.replace('toggle_', '');
    const enabled = this.checked;
    $(`#param_${name}`).prop('disabled', !enabled);
    $(`#tags_${name}`).find('.remove-tag').css('pointer-events', enabled ? '' : 'none');
    $(`#group_${name}`).removeClass('enabled disabled').addClass(enabled ? 'enabled' : 'disabled');
    $(`#group_${name}`).find('.array-add-btn').prop('disabled', !enabled);
    updateEnabledCount();
  });

  // Auto-fill now
  $(document).on('click', '.auto-fill-btn', function () {
    const targetId = $(this).data('target');
    $(`#${targetId}`).val(getCurrentDateTime());
  });

  // Array: add tag on Enter
  $(document).on('keydown', '.array-new-input', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addArrayTag($(this));
    }
  });

  // Array: add tag on button click
  $(document).on('click', '.array-add-btn', function () {
    const name = $(this).data('target');
    addArrayTag($(`#param_${name}`));
  });

  // Array: remove tag
  $(document).on('click', '.remove-tag', function () {
    const paramName = $(this).closest('.array-tags-container').attr('id').replace('tags_', '');
    $(this).parent('.array-tag').remove();
    syncArrayHiddenInput(paramName);
  });

  // Bulk buttons
  $('#enableAllBtn').on('click', function () {
    $('.param-toggle').prop('checked', true).trigger('change');
    showNotification('All parameters enabled', 'success');
  });
  $('#disableAllBtn').on('click', function () {
    $('.param-toggle').prop('checked', false).trigger('change');
    showNotification('All parameters disabled', 'warning');
  });
  $('#resetFormBtn').on('click', resetForm);

  // Generate
  $('#generateUrlBtn').on('click', generateUrl);

  // Generate IV
  $('#generateIvBtn').on('click', function () {
    const random = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    $('#ivInput').val(random);
  });

  // Copy / Open URL
  $('#copyUrlBtn').on('click', function () {
    copyText($('#finalUrl').val(), 'URL copied!');
  });
  $('#copyKeyBtn').on('click', function () {
    copyText($('#encryptedKeyDisplay').text(), 'Encrypted key copied!');
  });
  $('#openUrlBtn').on('click', function () {
    const url = $('#finalUrl').val();
    if (url) window.open(url, '_blank');
  });
}

function handleAesModeChange() {
  const mode = $('#aesMode').val();
  if (mode === 'ECB') {
    $('#ivRow').hide();
  } else {
    $('#ivRow').show();
  }
}

function addArrayTag($input) {
  const paramName = $input.attr('id').replace('param_', '');
  const val = $input.val().trim();
  if (!val) return;

  // Check duplicate
  const existing = [];
  $(`#tags_${paramName} .array-tag`).each(function () {
    existing.push($(this).text().replace('×', '').trim());
  });
  if (existing.includes(val)) {
    showNotification(`"${val}" already added`, 'warning');
    return;
  }

  $(`#tags_${paramName}`).append(createTagHtml(val));
  syncArrayHiddenInput(paramName);
  $input.val('');
}

// ============================
// Generate URL
// ============================
function generateUrl() {
  try {
    // Validate
    const targetUrl = $('#targetUrl').val().trim();
    const appId = $('#appId').val().trim();
    const secretKey = $('#secretKey').val().trim();

    if (!targetUrl) { showNotification('Please enter Target URL', 'danger'); $('#targetUrl').focus(); return; }
    try { new URL(targetUrl); } catch { showNotification('Please enter a valid URL', 'danger'); return; }
    if (!appId) { showNotification('Please enter App ID', 'danger'); $('#appId').focus(); return; }
    if (!secretKey) { showNotification('Please enter Secret Key', 'danger'); $('#secretKey').focus(); return; }

    // Build JSON payload from enabled params
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      showNotification('Please enable at least one parameter', 'warning');
      return;
    }

    // Validate mandatory params
    const mandatoryMissing = PARAMETER_DEFINITIONS
      .filter(p => p.mandatory && !payload[p.name])
      .map(p => p.name);
    if (mandatoryMissing.length > 0) {
      showNotification(`Mandatory parameters missing or empty: ${mandatoryMissing.join(', ')}`, 'danger');
      return;
    }

    const payloadStr = JSON.stringify(payload);

    // Encrypt
    const encryptedKey = encryptPayload(payloadStr, secretKey);

    // Build URL: base_url + sc + /login?app_id=...&key=...
    const sc = payload.sc || '';
    const loginPath = sc ? `${sc}/login` : '/login';
    const finalUrl = `${targetUrl}${loginPath}?app_id=${appId}&key=${encryptedKey}`;

    // Display results
    displayResults(payload, payloadStr, encryptedKey, finalUrl);
    showNotification('URL generated successfully!', 'success');

  } catch (err) {
    showNotification('Error: ' + err.message, 'danger');
    console.error(err);
  }
}

function buildPayload() {
  const payload = {};
  PARAMETER_DEFINITIONS.forEach(function (param) {
    const toggle = $(`#toggle_${param.name}`);
    if (!toggle.prop('checked')) return;

    if (param.type === 'array') {
      // Read from tags
      const values = [];
      $(`#tags_${param.name} .array-tag`).each(function () {
        values.push($(this).text().replace('×', '').trim());
      });
      if (values.length > 0) payload[param.name] = values;
    } else if (param.type === 'datetime-local') {
      const val = $(`#param_${param.name}`).val();
      if (val) payload[param.name] = val.includes(':') && val.split(':').length === 2 ? val + ':00' : val;
    } else if (param.type === 'select') {
      const val = $(`#param_${param.name}`).val();
      if (val === 'true') payload[param.name] = true;
      else if (val === 'false') payload[param.name] = false;
      else if (val) payload[param.name] = val;
    } else {
      const val = $(`#param_${param.name}`).val().trim();
      if (val !== '') payload[param.name] = val;
    }
  });
  return payload;
}

function encryptPayload(payloadStr, secretKey) {
  const mode = $('#aesMode').val();
  const keySize = parseInt($('#keySize').val());
  const keyBytes = keySize / 8;
  const customIV = $('#ivInput').val().trim();

  // Prepare key
  let key;
  if (secretKey.length === keyBytes * 2 && /^[0-9a-fA-F]+$/.test(secretKey)) {
    key = CryptoJS.enc.Hex.parse(secretKey);
  } else {
    const keyStr = secretKey.padEnd(keyBytes, '0').substring(0, keyBytes);
    key = CryptoJS.enc.Utf8.parse(keyStr);
  }

  let cryptoMode;
  switch (mode) {
    case 'CBC': cryptoMode = CryptoJS.mode.CBC; break;
    case 'CTR': cryptoMode = CryptoJS.mode.CTR; break;
    case 'CFB': cryptoMode = CryptoJS.mode.CFB; break;
    default:    cryptoMode = CryptoJS.mode.ECB;
  }

  let encrypted;
  if (mode === 'ECB') {
    encrypted = CryptoJS.AES.encrypt(payloadStr, key, {
      mode: cryptoMode,
      padding: CryptoJS.pad.Pkcs7,
    });
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  } else {
    let iv;
    if (customIV && customIV.length === 32 && /^[0-9a-fA-F]+$/.test(customIV)) {
      iv = CryptoJS.enc.Hex.parse(customIV);
    } else {
      iv = CryptoJS.lib.WordArray.create([0,0,0,0]); // Zero IV
    }
    encrypted = CryptoJS.AES.encrypt(payloadStr, key, {
      iv: iv,
      mode: cryptoMode,
      padding: CryptoJS.pad.Pkcs7,
    });
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  }
}

// ============================
// Display Results
// ============================
function displayResults(payload, payloadStr, encryptedKey, finalUrl) {
  $('#resultCard').show();
  $('#jsonPreview').text(JSON.stringify(payload, null, 2));
  $('#encryptedKeyDisplay').text(encryptedKey);
  $('#finalUrl').val(finalUrl);

  const now = new Date();
  $('#statParamCount').text(Object.keys(payload).length);
  $('#statKeyLength').text(encryptedKey.length + ' chars');
  $('#statUrlLength').text(finalUrl.length + ' chars');
  $('#statTime').text(now.toLocaleTimeString());

  $('html, body').animate({ scrollTop: $('#resultCard').offset().top - 80 }, 400);
}

// ============================
// Helpers
// ============================
function getCurrentDateTime() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function setInitialDateTimes() {
  $('#param_request_datetime').val(getCurrentDateTime());
  // Sync array hidden inputs on init
  PARAMETER_DEFINITIONS.filter(p => p.type === 'array').forEach(p => syncArrayHiddenInput(p.name));
}

function updateEnabledCount() {
  $('#enabledCount').text($('.param-toggle:checked').length);
}

function resetForm() {
  PARAMETER_DEFINITIONS.forEach(function (param) {
    const toggle = $(`#toggle_${param.name}`);
    toggle.prop('checked', param.enabled).trigger('change');

    if (param.type === 'array') {
      $(`#tags_${param.name}`).html(
        (param.defaultValue || []).map(v => createTagHtml(v)).join('')
      );
      syncArrayHiddenInput(param.name);
    } else if (param.type === 'select') {
      $(`#param_${param.name}`).val(param.defaultValue);
    } else if (param.type === 'datetime-local') {
      $(`#param_${param.name}`).val(getCurrentDateTime());
    } else {
      $(`#param_${param.name}`).val(param.defaultValue);
    }
  });
  $('#resultCard').hide();
  showNotification('Form reset to default values', 'info');
}

function copyText(text, successMsg) {
  if (!text) { showNotification('Nothing to copy', 'warning'); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showNotification(successMsg, 'success'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showNotification(successMsg, 'success');
  }
}

function showNotification(message, type) {
  $.notify({
    icon: type === 'success' ? 'fas fa-check' : type === 'danger' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle',
    message: message,
  }, {
    type: type,
    placement: { from: 'top', align: 'right' },
    time: 3000,
  });
}
