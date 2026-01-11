// AES Encryption/Decryption Tool JavaScript
$(document).ready(function() {
  let systemsConfig = [];
  let currentConfig = null;

// ตรวจสอบว่า CryptoJS โหลดสำเร็จหรือไม่
  if (typeof CryptoJS !== 'undefined') {
    console.log('✅ CryptoJS loaded successfully from local file');
    console.log('CryptoJS version:', CryptoJS.lib.WordArray ? 'Available' : 'Error');
  } else {
    console.error('❌ CryptoJS failed to load');
    showNotification('CryptoJS library not loaded. Encryption will not work.', 'danger');
  }

  // Load system configurations
  function loadSystemConfigs() {
    $.getJSON('../assets/config/systems-config.json')
      .done(function(data) {
        systemsConfig = data.systems;
        populateSystemDropdown();
        console.log('System configurations loaded successfully');
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load system configurations:', errorThrown);
        // Show error notification
        $.notify({
          icon: 'fas fa-exclamation-triangle',
          title: 'Configuration Error!',
          message: 'Failed to load system configurations. Using default settings.',
        }, {
          type: 'warning',
          placement: {
            from: "top",
            align: "right"
          },
          time: 4000,
        });
        
        // Use fallback configuration
        systemsConfig = [{
          id: "custom_config",
          name: "Custom Configuration",
          description: "Manual configuration"
        }];
        populateSystemDropdown();
      });
  }

  // Populate system dropdown
  function populateSystemDropdown() {
    const $dropdown = $('#systemSelect');
    $dropdown.empty();
    $dropdown.append('<option value="">Select System Configuration...</option>');
    
    systemsConfig.forEach(function(system) {
      $dropdown.append(`<option value="${system.id}">${system.name}</option>`);
    });
  }

  // Apply system configuration
  function applySystemConfig(systemId) {
    const config = systemsConfig.find(s => s.id === systemId);
    if (!config) return;

    currentConfig = config;
    
    // Update form fields
    $('#secretKey').val(config.secret_key || '');
    $('#keySize').val(config.key_size || 256);
    $('#mode').val(config.encryption_mode || 'CBC');
    $('#iv').val(config.iv || '');
    
    // Update mode visibility
    $('#mode').trigger('change');
    
    // Update information display
    updateSystemInfo(config);
    updateCounts();
    
    // Enable/disable fields based on config
    const isCustom = systemId === 'custom_config';
    $('#secretKey, #keySize, #mode, #iv').prop('disabled', !isCustom);
    $('#generateKey, #generateIV').prop('disabled', !isCustom);
    
    if (!isCustom) {
      // Show lock icon for read-only fields
      $('.form-group label').removeClass('config-locked');
      $('#secretKey, #keySize, #mode, #iv').closest('.form-group').find('label').addClass('config-locked');
    } else {
      $('.form-group label').removeClass('config-locked');
    }

    // Show success notification
    $.notify({
      icon: 'fas fa-cog',
      title: 'Configuration Applied!',
      message: `Loaded settings for ${config.name}`,
    }, {
      type: 'info',
      placement: {
        from: "top",
        align: "right"
      },
      time: 3000,
    });
  }

  // Update system information display
  function updateSystemInfo(config) {
    const $infoCard = $('#systemInfoCard');
    if (!config || config.id === 'custom_config') {
      $infoCard.hide();
      return;
    }

    $infoCard.show();
    $('#systemName').text(config.name);
    $('#systemOrg').text(config.organization || 'N/A');
    $('#systemBU').text(config.bu_code || 'N/A');
    $('#systemAppId').text(config.app_id || 'N/A');
    $('#systemUser').text(config.user || 'N/A');
    $('#systemDesc').text(config.description || 'No description available');
  }

  // Update character counts
  function updateCounts() {
    $('#inputLength').text($('#inputText').val().length);
    $('#outputLength').text($('#outputText').val().length);
    $('#keyLength').text($('#secretKey').val().length);
    $('#ivLength').text($('#iv').val().length);
  }

  // Validate configuration
  function validateConfig() {
    const secretKey = $('#secretKey').val();
    const keySize = parseInt($('#keySize').val());
    const mode = $('#mode').val();
    const iv = $('#iv').val();

    // Validate key length
    const expectedKeyLength = keySize / 8;
    if (secretKey.length !== expectedKeyLength) {
      throw new Error(`Secret key must be exactly ${expectedKeyLength} characters for ${keySize}-bit encryption`);
    }

    // Validate IV for modes that require it
    if (mode !== 'ECB' && iv && iv.length !== 16) {
      throw new Error('IV must be exactly 16 characters when provided');
    }

    return true;
  }

  // Event Handlers
  $('#systemSelect').on('change', function() {
    const systemId = $(this).val();
    if (systemId) {
      applySystemConfig(systemId);
    } else {
      currentConfig = null;
      updateSystemInfo(null);
      // Enable all fields for manual configuration
      $('#secretKey, #keySize, #mode, #iv').prop('disabled', false);
      $('#generateKey, #generateIV').prop('disabled', false);
      $('.form-group label').removeClass('config-locked');
    }
  });

  // Handle mode change
  $('#mode').on('change', function() {
    const mode = $(this).val();
    if (mode === 'ECB') {
      $('#ivGroup').hide();
    } else {
      $('#ivGroup').show();
    }
  });

  // Generate random key
  $('#generateKey').on('click', function() {
    if ($('#secretKey').prop('disabled')) {
      $.notify({
        icon: 'fas fa-lock',
        title: 'Configuration Locked!',
        message: 'Cannot modify key in system configuration mode',
      }, {
        type: 'warning',
        placement: {
          from: "top",
          align: "right"
        },
        time: 3000,
      });
      return;
    }

    const keySize = parseInt($('#keySize').val());
    const keyLength = keySize / 8;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < keyLength; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    $('#secretKey').val(key);
    updateCounts();
  });

  // Generate random IV
  $('#generateIV').on('click', function() {
    if ($('#iv').prop('disabled')) {
      $.notify({
        icon: 'fas fa-lock',
        title: 'Configuration Locked!',
        message: 'Cannot modify IV in system configuration mode',
      }, {
        type: 'warning',
        placement: {
          from: "top",
          align: "right"
        },
        time: 3000,
      });
      return;
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let iv = '';
    for (let i = 0; i < 16; i++) {
      iv += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    $('#iv').val(iv);
    updateCounts();
  });

  // Load sample data
  $('#loadSample').on('click', function() {
    $('#inputText').val('Hello World! This is a test message for AES encryption.');
    updateCounts();
  });

  // Copy result to clipboard
  $('#copyResult').on('click', function() {
    const outputText = $('#outputText').val();
    if (outputText) {
      navigator.clipboard.writeText(outputText).then(function() {
        $.notify({
          icon: 'fas fa-check',
          title: 'Success!',
          message: 'Result copied to clipboard',
        }, {
          type: 'success',
          placement: {
            from: "top",
            align: "right"
          },
          time: 2000,
        });
      });
    }
  });

  // Clear all fields
  $('#clearBtn').on('click', function() {
    $('#inputText').val('');
    $('#outputText').val('');
    $('#secretKey').val('');
    $('#keySize').val('128');
    $('#mode').val('CBC');
    $('#iv').val('');
    updateCounts();
  });

  // Encryption function
  $('#encryptBtn').on('click', function() {
    try {
      const inputText = $('#inputText').val();
      const secretKey = $('#secretKey').val();
      const mode = $('#mode').val();
      const outputFormat = $('#outputFormat').val();
      const inputFormat = $('#inputFormat').val();
      let iv = $('#iv').val();

      if (!inputText) {
        throw new Error('Please enter text to encrypt');
      }
      if (!secretKey) {
        throw new Error('Please enter a secret key or select a system configuration');
      }

      // Validate configuration
      validateConfig();

      let textToEncrypt = inputText;
      
      // Handle input format
      if (inputFormat === 'Base64') {
        textToEncrypt = CryptoJS.enc.Base64.parse(inputText).toString(CryptoJS.enc.Utf8);
      } else if (inputFormat === 'Hex') {
        textToEncrypt = CryptoJS.enc.Hex.parse(inputText).toString(CryptoJS.enc.Utf8);
      }

      // Prepare key
      const key = CryptoJS.enc.Utf8.parse(secretKey);
      
      let encrypted;
      
      if (mode === 'ECB') {
        encrypted = CryptoJS.AES.encrypt(textToEncrypt, key, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
      } else if (mode === 'CBC') {
        if (!iv) {
          iv = CryptoJS.lib.WordArray.create([0, 0, 0, 0]); // Zero IV
        } else {
          iv = CryptoJS.enc.Utf8.parse(iv);
        }
        encrypted = CryptoJS.AES.encrypt(textToEncrypt, key, {
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
          iv: iv
        });
      } else if (mode === 'CTR') {
        if (!iv) {
          iv = CryptoJS.lib.WordArray.create([0, 0, 0, 0]); // Zero IV
        } else {
          iv = CryptoJS.enc.Utf8.parse(iv);
        }
        encrypted = CryptoJS.AES.encrypt(textToEncrypt, key, {
          mode: CryptoJS.mode.CTR,
          padding: CryptoJS.pad.NoPadding,
          iv: iv
        });
      } else {
        throw new Error('Unsupported mode: ' + mode);
      }

      let result;
      if (outputFormat === 'Hex') {
        result = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
      } else {
        result = encrypted.toString();
      }

      $('#outputText').val(result);
      updateCounts();

      // Show success notification with system info
      const systemInfo = currentConfig ? ` using ${currentConfig.name}` : '';
      $.notify({
        icon: 'fas fa-lock',
        title: 'Success!',
        message: `Text encrypted successfully${systemInfo}`,
      }, {
        type: 'success',
        placement: {
          from: "top",
          align: "right"
        },
        time: 2000,
      });

    } catch (error) {
      $.notify({
        icon: 'fas fa-exclamation-triangle',
        title: 'Encryption Error!',
        message: error.message,
      }, {
        type: 'danger',
        placement: {
          from: "top",
          align: "right"
        },
        time: 4000,
      });
    }
  });

  // Decryption function
  $('#decryptBtn').on('click', function() {
    try {
      const inputText = $('#inputText').val();
      const secretKey = $('#secretKey').val();
      const mode = $('#mode').val();
      const inputFormat = $('#inputFormat').val();
      let iv = $('#iv').val();

      if (!inputText) {
        throw new Error('Please enter text to decrypt');
      }
      if (!secretKey) {
        throw new Error('Please enter a secret key or select a system configuration');
      }

      // Validate configuration
      validateConfig();

      // Prepare key
      const key = CryptoJS.enc.Utf8.parse(secretKey);
      
      let textToDecrypt = inputText;
      
      // Handle input format for decryption
      let ciphertext;
      if (inputFormat === 'Hex') {
        ciphertext = CryptoJS.enc.Hex.parse(inputText);
        textToDecrypt = CryptoJS.enc.Base64.stringify(ciphertext);
      }

      let decrypted;
      
      if (mode === 'ECB') {
        decrypted = CryptoJS.AES.decrypt(textToDecrypt, key, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
      } else if (mode === 'CBC') {
        if (!iv) {
          iv = CryptoJS.lib.WordArray.create([0, 0, 0, 0]); // Zero IV
        } else {
          iv = CryptoJS.enc.Utf8.parse(iv);
        }
        decrypted = CryptoJS.AES.decrypt(textToDecrypt, key, {
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
          iv: iv
        });
      } else if (mode === 'CTR') {
        if (!iv) {
          iv = CryptoJS.lib.WordArray.create([0, 0, 0, 0]); // Zero IV
        } else {
          iv = CryptoJS.enc.Utf8.parse(iv);
        }
        decrypted = CryptoJS.AES.decrypt(textToDecrypt, key, {
          mode: CryptoJS.mode.CTR,
          padding: CryptoJS.pad.NoPadding,
          iv: iv
        });
      } else {
        throw new Error('Unsupported mode: ' + mode);
      }

      const result = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!result) {
        throw new Error('Decryption failed. Please check your key, IV, and input format.');
      }

      $('#outputText').val(result);
      updateCounts();

      // Show success notification with system info
      const systemInfo = currentConfig ? ` using ${currentConfig.name}` : '';
      $.notify({
        icon: 'fas fa-unlock',
        title: 'Success!',
        message: `Text decrypted successfully${systemInfo}`,
      }, {
        type: 'success',
        placement: {
          from: "top",
          align: "right"
        },
        time: 2000,
      });

    } catch (error) {
      $.notify({
        icon: 'fas fa-exclamation-triangle',
        title: 'Decryption Error!',
        message: error.message,
      }, {
        type: 'danger',
        placement: {
          from: "top",
          align: "right"
        },
        time: 4000,
      });
    }
  });

  // Update counts when text changes
  $('#inputText, #secretKey, #iv').on('input', updateCounts);
  
  // Initialize
  loadSystemConfigs();
  updateCounts();
  $('#mode').trigger('change');
});