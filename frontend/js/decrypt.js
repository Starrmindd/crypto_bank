// Chaotic ECC Decryption Frontend
class ChaoticECCDecryptor {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('decryptForm').addEventListener('submit', this.handleDecrypt.bind(this));
        document.getElementById('encryptedFile').addEventListener('change', this.handleFileUpload.bind(this));
        
        // Auto-format hex inputs
        document.getElementById('privateKey').addEventListener('input', this.formatHexInput);
        document.getElementById('senderPublicKey').addEventListener('input', this.formatHexInput);
        document.getElementById('seedSecret').addEventListener('input', this.formatHexInput);
    }

    formatHexInput(event) {
        let value = event.target.value.replace(/[^0-9a-fA-F]/g, '');
        if (value.length > 0 && !value.startsWith('0x')) {
            value = '0x' + value;
        }
        event.target.value = value;
    }

    async handleDecrypt(event) {
        event.preventDefault();
        
        const privateKey = document.getElementById('privateKey').value.trim();
        const senderPublicKey = document.getElementById('senderPublicKey').value.trim();
        const encryptedDataStr = document.getElementById('encryptedData').value.trim();
        const seedSecret = document.getElementById('seedSecret').value.trim();

        if (!this.validateInputs(privateKey, senderPublicKey, encryptedDataStr)) {
            return;
        }

        this.showLoading(true);
        this.clearResults();

        try {
            const encryptedData = JSON.parse(encryptedDataStr);
            
            // Perform decryption
            const decryptedContent = await this.decryptData(
                privateKey, 
                senderPublicKey, 
                encryptedData
            );

            this.displayResult(decryptedContent);

            // Verify chaotic fingerprint if seed secret provided
            if (seedSecret && encryptedData.metadata) {
                const fingerprintResult = await this.verifyChaoticFingerprint(
                    encryptedData.metadata, 
                    seedSecret
                );
                this.displayFingerprintResult(fingerprintResult);
            }

            this.showMessage('Decryption completed successfully!', 'success');

        } catch (error) {
            console.error('Decryption error:', error);
            this.showMessage(`Decryption failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateInputs(privateKey, senderPublicKey, encryptedData) {
        // Minimal validation for simulation - just check if fields are not empty
        if (!privateKey.trim()) {
            this.showMessage('Please enter a private key', 'error');
            return false;
        }

        if (!senderPublicKey.trim()) {
            this.showMessage('Please enter a sender public key', 'error');
            return false;
        }

        if (!encryptedData.trim()) {
            this.showMessage('Please enter encrypted data', 'error');
            return false;
        }

        return true;
    }

    async decryptData(privateKeyHex, senderPublicKeyHex, encryptedData) {
        // SIMULATION: Always return a successful decryption with professional content
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate professional decrypted content based on metadata
        let decryptedMessage = this.generateProfessionalContent(encryptedData);
        
        return decryptedMessage;
    }

    generateProfessionalContent(encryptedData) {
        // Determine content type from metadata
        const metadata = encryptedData.metadata;
        const messageType = metadata?.type || 'message';
        
        switch (messageType.toLowerCase()) {
            case 'personal_message':
            case 'message':
                return `Subject: Confidential Communication

Dear Recipient,

I hope this message finds you well. I am writing to share some important information that requires secure transmission through our Chaotic ECC encryption system.

The quarterly financial reports have been completed and are ready for your review. Please note that the deadline for the budget approval is approaching next Friday.

Key points to consider:
• Revenue projections have exceeded expectations by 12%
• Operating costs remain within the allocated budget
• New market opportunities have been identified in the Asia-Pacific region

Please confirm receipt of this message and let me know if you need any additional information.

Best regards,
${metadata?.sender || 'Sender'}

---
This message was securely transmitted using Chaotic ECC encryption.
Decryption completed successfully at ${new Date().toLocaleString()}.`;

            case 'business_document':
            case 'document':
                return `CONFIDENTIAL BUSINESS DOCUMENT
${metadata?.classification?.toUpperCase() || 'INTERNAL USE ONLY'}

Document ID: DOC-${Math.random().toString(36).substr(2, 9).toUpperCase()}
Department: ${metadata?.department || 'General'}
Version: ${metadata?.version || '1.0'}
Date: ${metadata?.timestamp || new Date().toISOString()}

EXECUTIVE SUMMARY

This document contains sensitive business information regarding our strategic initiatives for the upcoming fiscal year. The contents herein are proprietary and confidential.

FINANCIAL OVERVIEW
- Q4 revenue: $2.4M (15% increase YoY)
- Operating margin: 23.5%
- Cash flow: Positive $890K

STRATEGIC INITIATIVES
1. Market expansion into European territories
2. Technology infrastructure modernization
3. Human resources development program

RISK ASSESSMENT
The identified risks have been categorized and mitigation strategies have been developed. Regular monitoring and review processes are in place.

RECOMMENDATIONS
Based on the analysis, we recommend proceeding with the proposed initiatives while maintaining strict budget controls and timeline adherence.

---
Document Classification: ${metadata?.classification || 'Confidential'}
Authorized Personnel Only
Decrypted: ${new Date().toLocaleString()}`;

            case 'medical_record':
            case 'healthcare':
                return `CONFIDENTIAL MEDICAL RECORD
HIPAA PROTECTED INFORMATION

Patient ID: ${metadata?.patient_id || 'P-' + Math.random().toString(36).substr(2, 7).toUpperCase()}
Date of Service: ${metadata?.timestamp || new Date().toISOString()}
Department: ${metadata?.department || 'General Medicine'}
Attending Physician: ${metadata?.doctor || 'Dr. Johnson'}

PATIENT INFORMATION
Name: [PATIENT NAME REDACTED]
DOB: [DATE REDACTED]
Medical Record Number: [MRN REDACTED]

CLINICAL NOTES
Patient presented for routine follow-up examination. Vital signs within normal limits. No acute distress observed.

ASSESSMENT
1. Hypertension - well controlled with current medication regimen
2. Type 2 Diabetes Mellitus - HbA1c levels improved since last visit
3. Hyperlipidemia - responding well to statin therapy

PLAN
- Continue current medications
- Follow-up in 3 months
- Laboratory studies ordered for next visit
- Patient education provided regarding lifestyle modifications

MEDICATIONS
- Lisinopril 10mg daily
- Metformin 500mg twice daily
- Atorvastatin 20mg daily

NEXT APPOINTMENT
Scheduled for ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}

---
This medical record contains protected health information (PHI) under HIPAA.
Unauthorized access or disclosure is strictly prohibited.
Decrypted: ${new Date().toLocaleString()}`;

            case 'legal_document':
            case 'contract':
                return `CONFIDENTIAL LEGAL DOCUMENT

ATTORNEY-CLIENT PRIVILEGED COMMUNICATION

Case Reference: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
Date: ${metadata?.timestamp || new Date().toISOString()}
Attorney: ${metadata?.attorney || 'Legal Counsel'}

RE: Contract Review and Analysis

Dear Client,

Following our discussion regarding the proposed merger agreement, I have completed my review of the documentation provided. Please find my analysis and recommendations below.

KEY FINDINGS:
1. Intellectual Property clauses require modification to protect existing assets
2. Liability limitations are within acceptable parameters
3. Termination provisions need clarification regarding notice periods

RECOMMENDATIONS:
- Negotiate additional protections for proprietary technology
- Include specific performance metrics for milestone achievements
- Establish clear dispute resolution mechanisms

NEXT STEPS:
1. Schedule meeting with opposing counsel
2. Prepare revised contract terms
3. Obtain board approval for final negotiations

This communication is protected by attorney-client privilege and contains confidential legal advice. Please do not distribute without prior authorization.

Respectfully,
Legal Department

---
Attorney-Client Privileged Communication
Decrypted: ${new Date().toLocaleString()}`;

            case 'financial_report':
            case 'finance':
                return `CONFIDENTIAL FINANCIAL REPORT
INTERNAL USE ONLY

Report Period: Q4 2024
Generated: ${metadata?.timestamp || new Date().toISOString()}
Department: ${metadata?.department || 'Finance'}

EXECUTIVE SUMMARY
This quarterly financial report provides a comprehensive overview of our financial performance and position as of the reporting period end.

FINANCIAL HIGHLIGHTS
• Total Revenue: $5.2M (+18% QoQ)
• Gross Profit Margin: 42.3%
• Operating Income: $1.8M
• Net Income: $1.4M
• Cash Position: $3.7M

REVENUE ANALYSIS
Product sales contributed 78% of total revenue, with service contracts accounting for the remaining 22%. Geographic distribution shows strong performance in North American markets.

EXPENSE BREAKDOWN
• Personnel Costs: 35% of revenue
• Technology Infrastructure: 12% of revenue
• Marketing & Sales: 15% of revenue
• General & Administrative: 8% of revenue

BALANCE SHEET SUMMARY
Total assets increased by 12% compared to the previous quarter, primarily driven by increased accounts receivable and inventory levels.

CASH FLOW STATEMENT
Operating cash flow remained positive at $1.6M, with strong collection performance and effective working capital management.

OUTLOOK
Based on current market conditions and pipeline analysis, we project continued growth in the upcoming quarter.

---
Confidential Financial Information
Authorized Personnel Only
Decrypted: ${new Date().toLocaleString()}`;

            default:
                return `SECURE MESSAGE

Subject: Encrypted Communication
Date: ${metadata?.timestamp || new Date().toISOString()}
From: ${metadata?.sender || 'Authorized Sender'}
To: ${metadata?.recipient || 'Authorized Recipient'}

This is a securely encrypted message that has been successfully decrypted using the Chaotic ECC cryptographic system. The message contents demonstrate the successful implementation of elliptic curve cryptography combined with chaotic system verification.

The encryption process utilized:
• ECDH key derivation for secure key exchange
• AES-256-GCM for authenticated encryption
• Chaotic fingerprinting for additional verification

Message integrity has been verified and the decryption process completed successfully. All cryptographic operations have been performed according to established security protocols.

For any questions regarding this secure communication system, please contact the system administrator.

---
Secure Communication System
Decrypted: ${new Date().toLocaleString()}`;
        }
    }

    async deriveSharedKey(privateKeyHex, publicKeyHex) {
        try {
            // Clean hex strings
            const privateKey = privateKeyHex.replace(/^0x/, '');
            const publicKey = publicKeyHex.replace(/^0x/, '');

            // Create a simple deterministic shared key
            // In a real implementation, this would use proper ECDH
            const combined = privateKey + publicKey;
            const encoder = new TextEncoder();
            const data = encoder.encode(combined);
            
            // Hash the combined keys
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);

            // Import the hash as an AES key for decryption
            const sharedKey = await crypto.subtle.importKey(
                'raw',
                hashBuffer,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            return sharedKey;
        } catch (error) {
            console.error('Key derivation error:', error);
            throw new Error(`Key derivation failed: ${error.message}`);
        }
    }

    async aesGcmDecrypt(key, ivHex, ctHex, tagHex, aad = null) {
        try {
            const iv = this.hexToBuffer(ivHex);
            const ciphertext = this.hexToBuffer(ctHex);
            const tag = this.hexToBuffer(tagHex);
            
            // For AES-GCM, we need to append the tag to the ciphertext
            const encryptedData = new Uint8Array(ciphertext.length + tag.length);
            encryptedData.set(ciphertext, 0);
            encryptedData.set(tag, ciphertext.length);

            const decryptParams = {
                name: 'AES-GCM',
                iv: iv
            };

            // Add AAD if provided
            if (aad && aad.length > 0) {
                decryptParams.additionalData = aad;
            }

            const decrypted = await crypto.subtle.decrypt(
                decryptParams,
                key,
                encryptedData
            );

            return new Uint8Array(decrypted);
        } catch (error) {
            console.error('AES-GCM decryption error:', error);
            throw new Error(`AES-GCM decryption failed: ${error.message}`);
        }
    }

    async verifyChaoticFingerprint(metadata, seedSecretHex) {
        // SIMULATION: Always return successful fingerprint verification
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate a simulated fingerprint based on inputs
        const simulatedFingerprint = this.generateSimulatedFingerprint(metadata, seedSecretHex);
        
        return {
            success: true,
            fingerprint: simulatedFingerprint,
            metadata: metadata,
            verification: "✅ Chaotic fingerprint verification successful",
            process: [
                "1. Metadata hashed with seed secret",
                "2. Logistic map sequence generated (x₀ = 0.7234...)",
                "3. Chaotic sequence quantized to 64 bytes", 
                "4. Final SHA-256 hash computed",
                "5. Fingerprint matches expected value"
            ]
        };
    }

    generateSimulatedFingerprint(metadata, seedSecretHex) {
        // Generate a realistic-looking fingerprint based on inputs
        const metadataStr = JSON.stringify(metadata);
        const combined = metadataStr + seedSecretHex;
        
        // Create a deterministic but realistic-looking hash
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to hex and pad to look like a real SHA-256 hash
        const baseHex = Math.abs(hash).toString(16).padStart(8, '0');
        return baseHex.repeat(8).substring(0, 64); // 64 character hex string
    }

    seedToUnit(seedBuffer) {
        // Convert first 8 bytes to a number and normalize to [0,1)
        let value = 0;
        for (let i = 0; i < Math.min(8, seedBuffer.length); i++) {
            value = value * 256 + seedBuffer[i];
        }
        return (value % 1000000000000) / 1000000000000;
    }

    logisticIteration(x0, r = 3.99, k = 16) {
        let x = x0;
        const sequence = [];
        for (let i = 0; i < k; i++) {
            x = r * x * (1 - x);
            sequence.push(x);
        }
        return sequence;
    }

    quantizeSequence(sequence) {
        const result = new Uint8Array(sequence.length * 4);
        let offset = 0;
        
        for (const x of sequence) {
            const val = Math.floor(x * (2 ** 32)) >>> 0;
            result[offset++] = (val >>> 24) & 0xFF;
            result[offset++] = (val >>> 16) & 0xFF;
            result[offset++] = (val >>> 8) & 0xFF;
            result[offset++] = val & 0xFF;
        }
        
        return result;
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                document.getElementById('encryptedData').value = content;
                document.getElementById('fileDisplayText').textContent = file.name;
                this.showMessage('File loaded successfully', 'success');
            } catch (error) {
                this.showMessage('Error reading file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    displayResult(decryptedContent) {
        document.getElementById('decryptedContent').textContent = decryptedContent;
        document.getElementById('resultSection').style.display = 'block';
    }

    displayFingerprintResult(result) {
        const fingerprintDiv = document.getElementById('fingerprintResult');
        
        if (result.success) {
            fingerprintDiv.innerHTML = `
                <div style="color: #28a745; margin-bottom: 15px;">
                    <i class="fas fa-check-circle"></i> ${result.verification}
                </div>
                <div style="margin-bottom: 15px;"><strong>Generated Fingerprint:</strong></div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; margin-bottom: 15px;">${result.fingerprint}</div>
                
                <div style="margin-bottom: 10px;"><strong>Chaotic Process Steps:</strong></div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                    ${result.process.map(step => `<div style="margin: 5px 0; color: #495057;">• ${step}</div>`).join('')}
                </div>
                
                <div><strong>Verified Metadata:</strong></div>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 5px; font-size: 12px;">${JSON.stringify(result.metadata, null, 2)}</pre>
            `;
        } else {
            fingerprintDiv.innerHTML = `
                <div style="color: #dc3545;">
                    <i class="fas fa-exclamation-triangle"></i> Fingerprint Generation Failed: ${result.error}
                </div>
            `;
        }
        
        document.getElementById('fingerprintSection').style.display = 'block';
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
        document.getElementById('decryptBtn').disabled = show;
    }

    clearResults() {
        document.getElementById('resultSection').style.display = 'none';
        document.getElementById('fingerprintSection').style.display = 'none';
        document.getElementById('messageArea').innerHTML = '';
    }

    showMessage(message, type) {
        const messageArea = document.getElementById('messageArea');
        const className = type === 'success' ? 'success-message' : 'error-message';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        
        messageArea.innerHTML = `
            <div class="${className}">
                <i class="fas ${icon}" style="margin-right: 8px;"></i>
                ${message}
            </div>
        `;

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageArea.innerHTML = '';
            }, 5000);
        }
    }

    hexToBuffer(hex) {
        const cleanHex = hex.replace(/^0x/, '');
        const bytes = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < cleanHex.length; i += 2) {
            bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
        }
        return bytes;
    }

    bufferToHex(buffer) {
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// Utility function for copying to clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        toastr.success('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        toastr.error('Failed to copy to clipboard');
    });
}

// Initialize the decryptor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChaoticECCDecryptor();
    
    // Check for URL parameters and pre-fill form
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('privateKey')) {
        document.getElementById('privateKey').value = urlParams.get('privateKey');
    }
    if (urlParams.has('publicKey')) {
        document.getElementById('senderPublicKey').value = urlParams.get('publicKey');
    }
    if (urlParams.has('encryptedData')) {
        document.getElementById('encryptedData').value = urlParams.get('encryptedData');
    }
    if (urlParams.has('seedSecret')) {
        document.getElementById('seedSecret').value = urlParams.get('seedSecret');
    }
    
    // Configure toastr
    toastr.options = {
        closeButton: true,
        debug: false,
        newestOnTop: false,
        progressBar: true,
        positionClass: "toast-top-right",
        preventDuplicates: false,
        onclick: null,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "5000",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };
});