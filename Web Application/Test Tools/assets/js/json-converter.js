// Sample data for testing different scenarios
      const samples = {
        python: `{
  name: 'John Doe',
  age: 30,
  active: True,
  salary: None,
  skills: ['Python', 'JavaScript', 'Testing']
}`,
        nested: `{
  user: {
    profile: {
      name: 'Jane Smith',
      settings: {
        theme: 'dark',
        notifications: True
      }
    }
  },
  status: 'active'
}`,
        array: `{
  users: [
    {name: 'Alice', active: True},
    {name: 'Bob', active: False},
    {name: 'Charlie', active: None}
  ],
  count: 3
}`,
        complex: `{
  api_response: {
    success: True,
    data: {
      items: ['item1', 'item2', 'item3'],
      meta: {
        total: 100,
        page: 1,
        has_next: False
      }
    },
    errors: None
  }
}`,
        edge: `{
  'quoted-key': 'value',
  123: 'numeric key',
  special_chars: "string with 'quotes'",
  empty_obj: {},
  empty_array: [],
  boolean_false: False,
  null_value: None
}`,
      };

      /**
       * Load sample data into the input area
       */
      function loadSample(type) {
        clearInput();
        if (samples[type]) {
          document.getElementById("inputArea").value = samples[type];
          updateStats();
          convert();
        }
      }

      /**
       * Update character and line count statistics
       */
      function updateStats() {
        const input = document.getElementById("inputArea").value;
        const lines = input.split("\n").length;
        const chars = input.length;

        document.getElementById("lineCount").textContent = lines;
        document.getElementById("charCount").textContent = chars;
      }

      /**
       * Convert string-like JSON to proper JSON object
       */
      function convertStringLikeJsonToObject(rawString) {
        let parsedObj;
        let isDeepParseEnabled = document.getElementById('deepParseToggle') ? document.getElementById('deepParseToggle').checked : true;

        let processedString = rawString.trim();

        try {
          // Step 1: Try standard JSON.parse first.
          parsedObj = JSON.parse(processedString);
          
          if (typeof parsedObj === 'string') {
            try {
              parsedObj = JSON.parse(parsedObj);
            } catch(e) { }
          }
        } catch (e1) {
          // Step 2: If standard parsing fails, check if the user pasted a string wrapped in extra quotes 
          // (common when copying from log files). Strip them before trying to fix the string.
          if (processedString.startsWith('"') && processedString.endsWith('"')) {
            processedString = processedString.substring(1, processedString.length - 1).trim();
          } else if (processedString.startsWith("'") && processedString.endsWith("'")) {
            processedString = processedString.substring(1, processedString.length - 1).trim();
          }

          // Fix the literal double backslash quote issue common in console logs
          // e.g., when a user pastes text containing: {\\"key\\":\\"value\\"}
          processedString = processedString.replace(/\\\\"/g, '\\"');

          try {
            // Enhanced regex patterns for better parsing
            let fixed = processedString
              .replace(/\bNone\b/g, "null")
              .replace(/\bTrue\b/g, "true")
              .replace(/\bFalse\b/g, "false")
              .replace(/'/g, '"')
              .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
              .replace(/([{,]\s*)(\d+)\s*:/g, '$1"$2":')
              .replace(/\s+/g, " ")
              .trim();

            // Validate bracket matching
            if (!validateBrackets(fixed)) {
              throw new Error("Mismatched brackets detected");
            }

            parsedObj = JSON.parse(fixed);
          } catch (e2) {
            // Enhanced error reporting with line numbers
            const errorInfo = getErrorLineInfo(processedString, e2.message);
            throw new Error(`Conversion failed: ${e2.message}${errorInfo}`);
          }
        }

        // Step 3: Deep parse nested stringified JSON (Unescape)
        if (isDeepParseEnabled) {
          parsedObj = recursiveUnescapeAndParse(parsedObj);
        }

        return parsedObj;
      }

      /**
       * Recursively traverses an object and tries to parse any string properties that look like JSON.
       */
      function recursiveUnescapeAndParse(val) {
        if (typeof val === 'string') {
            let parsedStr = val.trim();
            
            // If the string looks like an object or array, try to parse it
            if ((parsedStr.startsWith('{') && parsedStr.endsWith('}')) || 
                (parsedStr.startsWith('[') && parsedStr.endsWith(']'))) {
                try {
                    const parsed = JSON.parse(parsedStr);
                    // Recursively parse the children of this newly unescaped object
                    if (typeof parsed === 'object' && parsed !== null) {
                        return recursiveUnescapeAndParse(parsed);
                    }
                } catch(e) {
                    // Ignore parsing errors, keep the original string
                }
            }
            return parsedStr;
        } else if (typeof val === 'object' && val !== null) {
            if (Array.isArray(val)) {
                for (let i = 0; i < val.length; i++) {
                    val[i] = recursiveUnescapeAndParse(val[i]);
                }
            } else {
                for (let k in val) {
                    val[k] = recursiveUnescapeAndParse(val[k]);
                }
            }
        }
        return val;
      }

      /**
       * Validate that brackets are properly matched
       */
      function validateBrackets(str) {
        const stack = [];
        const pairs = { "(": ")", "[": "]", "{": "}" };

        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char in pairs) {
            stack.push(char);
          } else if (Object.values(pairs).includes(char)) {
            const last = stack.pop();
            if (pairs[last] !== char) {
              return false;
            }
          }
        }
        return stack.length === 0;
      }

      /**
       * Get additional error information
       */
      function getErrorLineInfo(text, errorMsg) {
        const lines = text.split("\n");
        if (lines.length > 1) {
          return ` (Input has ${lines.length} lines)`;
        }
        return "";
      }

      /**
       * Main conversion function
       */
      function convert() {
        const input = document.getElementById("inputArea").value.trim();
        const outputEl = document.getElementById("outputArea");
        const statusEl = document.getElementById("statusMsg");

        if (!input) {
          showStatus("⚠️ Please enter some data to convert", "warning");
          return;
        }

        try {
          const jsonObj = convertStringLikeJsonToObject(input);
          const formatted = JSON.stringify(jsonObj, null, 2);
          outputEl.textContent = formatted;

          const objCount = countObjects(jsonObj);
          showStatus(
            `✅ Conversion successful! Found ${objCount.objects} objects, ${objCount.arrays} arrays, ${objCount.primitives} primitive values`,
            "success"
          );

          // Hide results section on success
          document.getElementById("resultsSection").style.display = "none";
        } catch (e) {
          outputEl.textContent = "{}";
          showStatus(`❌ ${e.message}`, "error");

          // Show error analysis
          const errorInfo = analyzeError(e, input);
          displayError(errorInfo);
          document.getElementById("resultsSection").style.display = "block";
        }
      }

      /**
       * Count different types of objects in the JSON structure
       */
      function countObjects(
        obj,
        counts = { objects: 0, arrays: 0, primitives: 0 }
      ) {
        if (Array.isArray(obj)) {
          counts.arrays++;
          obj.forEach((item) => countObjects(item, counts));
        } else if (typeof obj === "object" && obj !== null) {
          counts.objects++;
          Object.values(obj).forEach((value) => countObjects(value, counts));
        } else {
          counts.primitives++;
        }
        return counts;
      }

      /**
       * Validate JSON without converting
       */
      function validateJson() {
        const input = document.getElementById("inputArea").value.trim();
        if (!input) {
          showStatus("⚠️ Please enter some data to validate", "warning");
          return;
        }

        try {
          convertStringLikeJsonToObject(input);
          showStatus(
            "✅ Input can be successfully converted to valid JSON!",
            "success"
          );
          document.getElementById("resultsSection").style.display = "none";
        } catch (e) {
          showStatus(`❌ Validation failed: ${e.message}`, "error");
          const errorInfo = analyzeError(e, input);
          displayError(errorInfo);
          document.getElementById("resultsSection").style.display = "block";
        }
      }

      /**
       * Copy result to clipboard
       */
      function copyToClipboard() {
        const output = document.getElementById("outputArea").textContent;
        if (output === "{}") {
          showStatus(
            "⚠️ Nothing to copy. Please convert some data first.",
            "warning"
          );
          return;
        }

        navigator.clipboard
          .writeText(output)
          .then(() => {
            showStatus("📋 JSON copied to clipboard!", "success");
          })
          .catch(() => {
            showStatus("❌ Failed to copy to clipboard", "error");
          });
      }

      /**
       * Download JSON as file
       */
      function downloadJson() {
        const output = document.getElementById("outputArea").textContent;
        if (output === "{}") {
          showStatus(
            "⚠️ Nothing to download. Please convert some data first.",
            "warning"
          );
          return;
        }

        const blob = new Blob([output], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `converted-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus("💾 JSON file downloaded!", "success");
      }

      /**
       * Clear all inputs and outputs
       */
      function clearAll() {
        document.getElementById("inputArea").value = "";
        document.getElementById("outputArea").textContent = "{}";
        document.getElementById("statusMsg").innerHTML = "";
        document.getElementById("results").innerHTML = "";
        document.getElementById("resultsSection").style.display = "none";
        updateStats();
        showStatus("🗑️ All data cleared", "info");
      }

      /**
       * Clear input only
       */
      function clearInput() {
        document.getElementById("inputArea").value = "";
        document.getElementById("results").innerHTML = "";
        document.getElementById("resultsSection").style.display = "none";
      }

      /**
       * Show status message with appropriate styling
       */
      function showStatus(message, type) {
        const statusEl = document.getElementById("statusMsg");
        let alertClass = "";

        switch (type) {
          case "success":
            alertClass = "alert alert-success";
            break;
          case "error":
            alertClass = "alert alert-danger";
            break;
          case "warning":
            alertClass = "alert alert-warning";
            break;
          case "info":
            alertClass = "alert alert-info";
            break;
        }

        statusEl.className = alertClass;
        statusEl.innerHTML = `<strong>${message}</strong>`;

        // Auto-hide after 5 seconds for success/info messages
        if (type === "success" || type === "info") {
          setTimeout(() => {
            statusEl.innerHTML = "";
            statusEl.className = "";
          }, 5000);
        }
      }

      /**
       * Analyze error details
       */
      function analyzeError(error, input) {
        const errorMessage = error.message;
        let position = -1;
        let lineNumber = 1;
        let columnNumber = 1;

        // Extract position from error message
        const positionMatch = errorMessage.match(/at position (\d+)/);
        if (positionMatch) {
          position = parseInt(positionMatch[1]);
        }

        // Calculate line and column
        if (position >= 0) {
          for (let i = 0; i < position && i < input.length; i++) {
            if (input[i] === "\n") {
              lineNumber++;
              columnNumber = 1;
            } else {
              columnNumber++;
            }
          }
        }

        // Find context around error
        const contextStart = Math.max(0, position - 50);
        const contextEnd = Math.min(input.length, position + 50);
        const context = input.substring(contextStart, contextEnd);

        // Find nearest key
        const keyInfo = findNearestKey(input, position);

        return {
          originalError: errorMessage,
          position: position,
          line: lineNumber,
          column: columnNumber,
          context: context,
          contextStart: contextStart,
          keyInfo: keyInfo,
          errorChar: position >= 0 ? input[position] : null,
        };
      }

      /**
       * Find the nearest key to error position
       */
      function findNearestKey(input, position) {
        if (position < 0) return null;

        let keyStart = -1;
        let keyEnd = -1;
        let inString = false;
        let stringChar = "";

        for (let i = position - 1; i >= 0; i--) {
          const char = input[i];

          if (
            (char === '"' || char === "'") &&
            (i === 0 || input[i - 1] !== "\\")
          ) {
            if (!inString) {
              keyEnd = i;
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              keyStart = i + 1;
              break;
            }
          }
        }

        if (keyStart >= 0 && keyEnd >= 0) {
          const key = input.substring(keyStart, keyEnd);
          const valueInfo = findValueForKey(input, keyEnd);

          return {
            key: key,
            keyStart: keyStart,
            keyEnd: keyEnd,
            valueInfo: valueInfo,
          };
        }

        return null;
      }

      /**
       * Find value associated with a key
       */
      function findValueForKey(input, keyEnd) {
        let colonPos = -1;
        for (let i = keyEnd; i < input.length; i++) {
          if (input[i] === ":") {
            colonPos = i;
            break;
          }
        }

        if (colonPos < 0) return null;

        let valueStart = -1;
        for (let i = colonPos + 1; i < input.length; i++) {
          if (input[i].trim() !== "") {
            valueStart = i;
            break;
          }
        }

        if (valueStart < 0) return null;

        const valuePreview = input.substring(
          valueStart,
          Math.min(valueStart + 100, input.length)
        );

        return {
          valueStart: valueStart,
          valuePreview: valuePreview,
        };
      }

      /**
       * Display detailed error information
       */
      function displayError(errorInfo) {
        const resultsDiv = document.getElementById("results");

        let html = `
          <div class="alert alert-danger">
            <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>JSON Parse Error</h5>
            
            <div class="mb-3">
              <strong>📍 Error Position:</strong><br>
              Position: ${errorInfo.position}<br>
              Line: ${errorInfo.line}, Column: ${errorInfo.column}
        `;

        if (errorInfo.errorChar) {
          html += `<br><strong>Character at error position:</strong> <code class="bg-danger text-white px-1">'${errorInfo.errorChar}'</code>`;
        }

        html += `</div>`;

        if (errorInfo.keyInfo) {
          html += `
            <div class="mb-3">
              <strong>🔑 Related Key:</strong> <code class="bg-info text-white px-1">${errorInfo.keyInfo.key}</code><br>
          `;

          if (errorInfo.keyInfo.valueInfo) {
            html += `<strong>💡 Value Preview:</strong> <code class="bg-secondary text-white px-1">${errorInfo.keyInfo.valueInfo.valuePreview}...</code><br>`;
          }

          html += `</div>`;
        }

        html += `
          <div class="mb-3">
            <strong>🔍 Error Message:</strong><br>
            <code>${errorInfo.originalError}</code>
          </div>
        `;

        if (errorInfo.context) {
          const contextWithHighlight = highlightErrorInContext(
            errorInfo.context,
            errorInfo.position - errorInfo.contextStart
          );

          html += `
            <div class="mb-3">
              <strong>📝 Context around Error:</strong>
              <div class="bg-light p-2 border rounded">
                <code>${contextWithHighlight}</code>
              </div>
            </div>
          `;
        }

        html += `
          <div class="mb-0">
            <strong>💡 Fix Suggestions:</strong><br>
            ${getFixSuggestion(errorInfo.originalError)}
          </div>
        `;

        resultsDiv.innerHTML = html;
      }

      /**
       * Highlight error character in context
       */
      function highlightErrorInContext(context, relativePosition) {
        if (relativePosition < 0 || relativePosition >= context.length) {
          return context;
        }

        const before = context.substring(0, relativePosition);
        const errorChar = context.substring(
          relativePosition,
          relativePosition + 1
        );
        const after = context.substring(relativePosition + 1);

        return (
          before +
          `<span class="bg-danger text-white px-1">${errorChar}</span>` +
          after
        );
      }

      /**
       * Get fix suggestion based on error message
       */
      function getFixSuggestion(errorMessage) {
        if (errorMessage.includes("Expected ',' or '}'")) {
          return "Missing comma (,) or closing brace (}). Check object or array structure.";
        } else if (errorMessage.includes("Unexpected token")) {
          return "Invalid character found. Check for incorrect quote marks or syntax errors.";
        } else if (errorMessage.includes("Expected property name")) {
          return 'Property keys must be enclosed in double quotes (").';
        } else if (errorMessage.includes("Unterminated string")) {
          return "String is not properly closed. Check quote marks.";
        }
        return "Please check JSON syntax for correctness.";
      }

      // Initialize when page loads
      $(document).ready(function () {
        updateStats();

        // Add keyboard shortcuts
        document.addEventListener("keydown", function (e) {
          // Ctrl+Enter or Cmd+Enter to convert
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            convert();
          }

          // Ctrl+Shift+C or Cmd+Shift+C to copy
          if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
            e.preventDefault();
            copyToClipboard();
          }

          // Ctrl+Shift+D or Cmd+Shift+D to download
          if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
            e.preventDefault();
            downloadJson();
          }
        });
      });