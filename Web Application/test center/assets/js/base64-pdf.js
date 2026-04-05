    // ---- Custom Base64 to PDF Script ---- //
      let currentPdfBlob = null;

      // Sample Base64 PDF for testing
      const sampleBase64 =
        "JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSANCjw8IAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCj4+Ci9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDUzCj4+CnN0cmVhbQpCVApxCjEgMCAwIDEgNTAgNzQwIFRtCi9GMSA0OCBUZgo1MC4xNiAwIFRkCihIZWxsbykgVGogCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAwMDkgMDAwMDAgbgowMDAwMDAwMDU4IDAwMDAwIG4KMDAwMDAwMDExNSAwMDAwMCBuCjAwMDAwMDAzMDQgMDAwMDAgbgp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQwNwolJUVPRg==";

      $(document).ready(function () {
        // Load sample data
        $("#loadSampleBtn").click(function () {
          $("#base64Input").val(sampleBase64);
          showStatus("Sample Base64 PDF loaded successfully!", "success");
        });

        // Clear input
        $("#clearInput").click(function () {
          $("#base64Input").val("");
          $("#resultCard").hide();
          showStatus("Input cleared.", "info");
        });

        // Convert Base64 to PDF
        $("#convertBtn").click(function () {
          const base64String = $("#base64Input").val().trim();

          if (!base64String) {
            showStatus("Please enter a Base64 string.", "danger");
            return;
          }

          try {
            convertBase64ToPDF(base64String);
          } catch (error) {
            showStatus("Error: " + error.message, "danger");
          }
        });

        // Download PDF
        $("#downloadBtn").click(function () {
          if (currentPdfBlob) {
            downloadPdf(currentPdfBlob);
          }
        });
      });

      function convertBase64ToPDF(base64String) {
        try {
          // Clean the base64 string
          let cleanBase64 = cleanBase64String(base64String);

          // Validate Base64
          if (!isValidBase64(cleanBase64)) {
            throw new Error("Invalid Base64 string format.");
          }

          // Convert to blob
          const byteCharacters = atob(cleanBase64);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          currentPdfBlob = new Blob([byteArray], { type: "application/pdf" });

          // Validate if it's a proper PDF
          if (!isPDF(byteArray)) {
            throw new Error(
              "The decoded data does not appear to be a valid PDF file."
            );
          }

          // Display results
          displayPdfResults(currentPdfBlob, cleanBase64.length);
          showStatus("Base64 successfully converted to PDF!", "success");
        } catch (error) {
          showStatus("Conversion failed: " + error.message, "danger");
          $("#resultCard").hide();
        }
      }

      function cleanBase64String(base64String) {
        // Remove data URI prefix if present
        if (base64String.startsWith("data:")) {
          const commaIndex = base64String.indexOf(",");
          if (commaIndex !== -1) {
            base64String = base64String.substring(commaIndex + 1);
          }
        }

        // Remove whitespace and newlines
        return base64String.replace(/\s/g, "");
      }

      function isValidBase64(str) {
        try {
          // Check if string contains only valid Base64 characters
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(str)) {
            return false;
          }

          // Try to decode
          atob(str);
          return true;
        } catch (e) {
          return false;
        }
      }

      function isPDF(byteArray) {
        // Check for PDF header (%PDF)
        const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

        if (byteArray.length < 4) return false;

        for (let i = 0; i < 4; i++) {
          if (byteArray[i] !== pdfHeader[i]) {
            return false;
          }
        }
        return true;
      }

      function displayPdfResults(pdfBlob, base64Length) {
        // Show result card
        $("#resultCard").show();

        // Create object URL for PDF preview
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Display PDF in iframe
        const pdfPreview = $("#pdfPreview");
        pdfPreview.html(`
          <iframe 
            src="${pdfUrl}" 
            width="100%" 
            height="500px" 
            style="border: 1px solid #ddd; border-radius: 4px;"
            title="PDF Preview">
            <p>Your browser does not support PDF preview. 
            <a href="${pdfUrl}" target="_blank">Click here to view the PDF</a></p>
          </iframe>
        `);

        // Update file information
        const fileSizeKB = Math.round((pdfBlob.size / 1024) * 100) / 100;
        const fileSizeMB =
          Math.round((pdfBlob.size / (1024 * 1024)) * 100) / 100;

        let sizeDisplay =
          fileSizeKB < 1024 ? `${fileSizeKB} KB` : `${fileSizeMB} MB`;

        $("#fileSize").text(sizeDisplay);
        $("#fileInfo").text(
          `${sizeDisplay} • ${Math.round(base64Length / 1024)} KB Base64`
        );

        // Scroll to results
        $("html, body").animate(
          {
            scrollTop: $("#resultCard").offset().top - 100,
          },
          500
        );
      }

      function downloadPdf(pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        
        // Generate timestamp in local time with format YYYY-MM-DDTHH:mm:ss
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const timestamp = `${year}-${month}-${day}T${hours}-${minutes}-${seconds}`;
        const filename = `converted-pdf-${timestamp}.pdf`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success notification with timestamp info
        $.notify({
          icon: 'fas fa-download',
          title: 'Download Complete!',
          message: `PDF saved as ${filename}<br><small>Generated at: ${year}-${month}-${day} ${hours}:${minutes}:${seconds} (Local Time)</small>`
        }, {
          type: 'success',
          placement: {
            from: 'top',
            align: 'right'
          },
          time: 4000
        });
      }

      function showStatus(message, type) {
        const statusDiv = $("#statusMessage");
        statusDiv
          .removeClass("alert-success alert-danger alert-warning alert-info")
          .addClass(`alert-${type}`)
          .html(`<i class="fas fa-${getIconForType(type)} me-2"></i>${message}`)
          .show();

        // Auto-hide after 5 seconds for success/info messages
        if (type === "success" || type === "info") {
          setTimeout(() => {
            statusDiv.fadeOut();
          }, 5000);
        }
      }

      function getIconForType(type) {
        const icons = {
          success: "check-circle",
          danger: "exclamation-triangle",
          warning: "exclamation-circle",
          info: "info-circle",
        };
        return icons[type] || "info-circle";
      }

      // Auto-resize textarea based on content
      $("#base64Input").on("input", function () {
        this.style.height = "auto";
        this.style.height = Math.max(200, this.scrollHeight) + "px";
      });
