/* ---- Custom PDF to Base64 Script ---- */

      let currentFile = null;
      let currentBase64 = '';
      let startTime = 0;

      $(document).ready(function() {
        // File input events
        $('#browseBtn').click(() => $('#fileInput').click());
        $('#fileInput').change(handleFileSelect);
        
        // Drag and drop events
        setupDragAndDrop();
        
        // Action buttons
        $('#clearUpload').click(clearUpload);
        $('#convertBtn').click(convertToBase64);
        $('#copyBtn').click(copyToClipboard);
        $('#downloadTxtBtn').click(downloadAsText);
        
        // Format change event
        $('input[name="outputFormat"]').change(updateOutputFormat);
      });

      function setupDragAndDrop() {
        const uploadZone = $('#uploadZone')[0];
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          uploadZone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
          uploadZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
          uploadZone.addEventListener(eventName, unhighlight, false);
        });

        uploadZone.addEventListener('drop', handleDrop, false);
      }

      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }

      function highlight(e) {
        $('#uploadZone').addClass('drag-over');
      }

      function unhighlight(e) {
        $('#uploadZone').removeClass('drag-over');
      }

      function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
          handleFile(files[0]);
        }
      }

      function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
          handleFile(file);
        }
      }

      function handleFile(file) {
        // Validate file type
        if (file.type !== 'application/pdf') {
          showStatus('Please select a PDF file only.', 'danger');
          return;
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          showStatus('File size exceeds 50MB limit. Please choose a smaller file.', 'danger');
          return;
        }

        currentFile = file;
        displayFileInfo(file);
        showStatus('PDF file loaded successfully!', 'success');
      }

      function displayFileInfo(file) {
        $('#uploadZone').hide();
        $('#fileInfo').show();
        $('#clearUpload').show();

        $('#fileName').text(file.name);
        $('#fileSize').text(formatFileSize(file.size));
        $('#lastModified').text(new Date(file.lastModified).toLocaleDateString());
      }

      function clearUpload() {
        currentFile = null;
        currentBase64 = '';
        $('#fileInput').val('');
        $('#uploadZone').show();
        $('#fileInfo').hide();
        $('#resultCard').hide();
        $('#clearUpload').hide();
        $('#statusMessage').hide();
        showStatus('Upload cleared.', 'info');
      }

      function convertToBase64() {
        if (!currentFile) {
          showStatus('Please select a PDF file first.', 'danger');
          return;
        }

        startTime = Date.now();
        showProgress(0);
        $('#convertBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Converting...');

        const reader = new FileReader();
        
        reader.onload = function(e) {
          try {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Simulate progress for better UX
            let progress = 0;
            const progressInterval = setInterval(() => {
              progress += Math.random() * 30;
              if (progress > 90) progress = 90;
              showProgress(progress);
            }, 100);

            // Convert to base64
            let binary = '';
            uint8Array.forEach(byte => {
              binary += String.fromCharCode(byte);
            });
            
            currentBase64 = btoa(binary);
            
            clearInterval(progressInterval);
            showProgress(100);
            
            setTimeout(() => {
              displayResults();
              $('#progressContainer').hide();
              $('#convertBtn').prop('disabled', false).html('<i class="fas fa-magic me-2"></i>Convert to Base64');
              showStatus('PDF successfully converted to Base64!', 'success');
            }, 500);

          } catch (error) {
            $('#progressContainer').hide();
            $('#convertBtn').prop('disabled', false).html('<i class="fas fa-magic me-2"></i>Convert to Base64');
            showStatus('Conversion failed: ' + error.message, 'danger');
          }
        };

        reader.onerror = function() {
          $('#progressContainer').hide();
          $('#convertBtn').prop('disabled', false).html('<i class="fas fa-magic me-2"></i>Convert to Base64');
          showStatus('Error reading file. Please try again.', 'danger');
        };

        reader.readAsArrayBuffer(currentFile);
      }

      function displayResults() {
        const endTime = Date.now();
        const processTime = ((endTime - startTime) / 1000).toFixed(2);
        
        // Show result card
        $('#resultCard').show();
        
        // Update output format
        updateOutputFormat();
        
        // Update statistics
        const originalSizeKB = Math.round(currentFile.size / 1024 * 100) / 100;
        const base64SizeKB = Math.round(currentBase64.length / 1024 * 100) / 100;
        const sizeIncrease = Math.round(((currentBase64.length / currentFile.size) - 1) * 100);
        
        $('#originalSize').text(formatFileSize(currentFile.size));
        $('#base64Size').text(formatFileSize(currentBase64.length));
        $('#sizeIncrease').text(`+${sizeIncrease}%`);
        $('#processTime').text(`${processTime}s`);
        $('#base64Length').text(currentBase64.length.toLocaleString());
        
        // Scroll to results
        $('html, body').animate({
          scrollTop: $('#resultCard').offset().top - 100
        }, 500);
      }

      function updateOutputFormat() {
        if (!currentBase64) return;
        
        const selectedFormat = $('input[name="outputFormat"]:checked').val();
        let output = '';
        
        switch (selectedFormat) {
          case 'plain':
            output = currentBase64;
            break;
          case 'datauri':
            output = `data:application/pdf;base64,${currentBase64}`;
            break;
          case 'htmlembed':
            output = `<embed type="application/pdf" src="data:application/pdf;base64,${currentBase64}" />`;
            break;
          case 'htmlobject':
            output = `<object type="application/pdf" data="data:application/pdf;base64,${currentBase64}"></object>`;
            break;
        }
        
        $('#base64Output').val(output);
      }

      function copyToClipboard() {
        const output = $('#base64Output').val();
        
        if (!output) {
          showStatus('No Base64 data to copy. Please convert a PDF first.', 'warning');
          return;
        }

        // Use modern Clipboard API (no length limit like execCommand)
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(output).then(function() {
            $.notify({
              icon: 'fas fa-copy',
              title: 'Copied!',
              message: `Base64 string copied to clipboard (${output.length.toLocaleString()} characters)`
            }, {
              type: 'success',
              placement: { from: 'top', align: 'right' },
              time: 3000
            });
          }).catch(function(err) {
            // Fallback if clipboard API fails (e.g. non-HTTPS)
            fallbackCopy(output);
          });
        } else {
          // Fallback for older browsers
          fallbackCopy(output);
        }
      }

      function fallbackCopy(text) {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.top = '-9999px';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          textarea.setSelectionRange(0, text.length); // Use actual length, not hardcoded limit
          document.execCommand('copy');
          document.body.removeChild(textarea);

          $.notify({
            icon: 'fas fa-copy',
            title: 'Copied!',
            message: `Base64 string copied to clipboard (${text.length.toLocaleString()} characters)`
          }, {
            type: 'success',
            placement: { from: 'top', align: 'right' },
            time: 3000
          });
        } catch (err) {
          showStatus('Failed to copy to clipboard. Please copy manually from the text area below.', 'warning');
        }
      }


      function downloadAsText() {
        if (!currentBase64) {
          showStatus('No Base64 data to download.', 'danger');
          return;
        }

        const output = $('#base64Output').val();
        const selectedFormat = $('input[name="outputFormat"]:checked').val();
        
        // Generate timestamp in local time with format YYYY-MM-DDTHH-mm-ss
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const timestamp = `${year}-${month}-${day}T${hours}-${minutes}-${seconds}`;
        const filename = `pdf-base64-${selectedFormat}-${timestamp}.txt`;
        
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success notification
        $.notify({
          icon: 'fas fa-download',
          title: 'Download Complete!',
          message: `Base64 saved as ${filename}<br><small>Generated at: ${year}-${month}-${day} ${hours}:${minutes}:${seconds} (Local Time)</small>`
        }, {
          type: 'success',
          placement: {
            from: 'top',
            align: 'right'
          },
          time: 4000
        });
      }

      function showProgress(percent) {
        $('#progressContainer').show();
        $('#progressBar').css('width', percent + '%');
        $('#progressPercent').text(Math.round(percent));
      }

      function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
      }

      function showStatus(message, type) {
        const statusDiv = $('#statusMessage');
        statusDiv.removeClass('alert-success alert-danger alert-warning alert-info')
               .addClass(`alert-${type}`)
               .html(`<i class="fas fa-${getIconForType(type)} me-2"></i>${message}`)
               .show();

        // Auto-hide after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
          setTimeout(() => {
            statusDiv.fadeOut();
          }, 5000);
        }
      }

      function getIconForType(type) {
        const icons = {
          'success': 'check-circle',
          'danger': 'exclamation-triangle',
          'warning': 'exclamation-circle',
          'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
      }