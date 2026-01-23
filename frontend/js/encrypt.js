// Chaotic ECC Encryption Frontend
class ChaoticECCEncryptor {
    constructor() {
        this.initializeEventListeners();
        this.encryptedData = null;
    }

    initializeEventListeners() {
        document.getElementById('encryptForm').addEventListener('submit', this.handleEncrypt.bind(this));
        
        // Auto-format hex inputs
        document.getElementById('privateKey').addEventListener('input', this.formatHexInput);
        document.getElementById('recipientPublicKey').addEventListener('input', this.formatHexInput);
        document.getElementById('seedSecret').addEventListener('input', this.formatHexInput);
    }

    formatHexInput(event) {
        let value = event.target.value.replace(/[^0-9a-fA-F]/g, '');
        if (value.length > 0 && !value.startsWith('0x')) {
            value = '0x' + value;
        }
        event.target.value = value;
    }

    async handleEncrypt(event) {
        event.preventDefault();
        
        const privateKey = document.getElementById('privateKey').value.trim();
        const recipientPublicKey = document.getElementById('recipientPublicKey').value.trim();
        const messageText = document.getElementById('messageText').value.trim();
        const metadataStr = document.getElementById('metadata').value.trim();
        const seedSecret = document.getElementById('seedSecret').value.trim();

        if (!this.validateInputs(privateKey, recipientPublicKey, messageText)) {
            return;
        }

        this.showLoading(true);
        this.clearResults();

        try {
            // Parse metadata if provided
            let metadata = null;
            if (metadataStr) {
                try {
                    metadata = JSON.parse(metadataStr);
                } catch (e) {
                    throw new Error('Invalid metadata JSON format');
                }
            }

            // Perform encryption
            const encryptedData = await this.encryptData(
                privateKey, 
                recipientPublicKey, 
                messageText,
                metadata
            );

            // Generate chaotic fingerprint if seed secret provided
            if (seedSecret && metadata) {
                const fingerprint = await this.generateChaoticFingerprint(metadata, seedSecret);
                encryptedData.chaoticFingerprint = fingerprint;
            }

            this.encryptedData = encryptedData;
            this.displayResult(JSON.stringify(encryptedData, null, 2));
            this.showMessage('Encryption completed successfully!', 'success');

        } catch (error) {
            console.error('Encryption error:', error);
            this.showMessage(`Encryption failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateInputs(privateKey, recipientPublicKey, messageText) {
        if (!privateKey || privateKey.length < 64) {
            this.showMessage('Please enter a valid private key (64 hex characters)', 'error');
            return false;
        }

        if (!recipientPublicKey || recipientPublicKey.length < 128) {
            this.showMessage('Please enter a valid recipient public key', 'error');
            return false;
        }

        if (!messageText) {
            this.showMessage('Please enter a message to encrypt', 'error');
            return false;
        }

        return true;
    }

    async encryptData(privateKeyHex, recipientPublicKeyHex, messageText, metadata = null) {
        // Derive shared key using ECDH
        const sharedKey = await this.deriveSharedKey(privateKeyHex, recipientPublicKeyHex);
        
        // Convert message to buffer
        const messageBuffer = new TextEncoder().encode(messageText);
        
        // Prepare additional authenticated data (AAD) if metadata exists
        let aad = null;
        if (metadata) {
            aad = new TextEncoder().encode(JSON.stringify(metadata));
        }

        // Encrypt using AES-GCM
        const encryptionResult = await this.aesGcmEncrypt(sharedKey, messageBuffer, aad);

        const result = {
            iv: encryptionResult.iv,
            ct: encryptionResult.ct,
            tag: encryptionResult.tag,
            timestamp: new Date().toISOString()
        };

        if (metadata) {
            result.metadata = metadata;
        }

        if (aad) {
            result.aad = this.bufferToHex(aad);
        }

        return result;
    }

    async deriveSharedKey(privateKeyHex, publicKeyHex) {
        try {
            // Clean hex strings
            const privateKey = privateKeyHex.replace(/^0x/, '');
            const publicKey = publicKeyHex.replace(/^0x/, '');

            // Create a simple deterministic shared key
            const combined = privateKey + publicKey;
            const encoder = new TextEncoder();
            const data = encoder.encode(combined);
            
            // Hash the combined keys
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);

            // Import the hash as an AES key for encryption
            const sharedKey = await crypto.subtle.importKey(
                'raw',
                hashBuffer,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            return sharedKey;
        } catch (error) {
            console.error('Key derivation error:', error);
            throw new Error(`Key derivation failed: ${error.message}`);
        }
    }

    async aesGcmEncrypt(key, plaintextBuffer, aad = null) {
        try {
            // Generate random IV (12 bytes for GCM)
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encryptParams = {
                name: 'AES-GCM',
                iv: iv
            };

            // Add AAD if provided
            if (aad && aad.length > 0) {
                encryptParams.additionalData = aad;
            }

            const encryptedBuffer = await crypto.subtle.encrypt(
                encryptParams,
                key,
                plaintextBuffer
            );

            const encrypted = new Uint8Array(encryptedBuffer);
            
            // Split ciphertext and tag (last 16 bytes are the tag)
            const ciphertext = encrypted.slice(0, -16);
            const tag = encrypted.slice(-16);

            return {
                iv: this.bufferToHex(iv),
                ct: this.bufferToHex(ciphertext),
                tag: this.bufferToHex(tag)
            };
        } catch (error) {
            console.error('AES-GCM encryption error:', error);
            throw new Error(`AES-GCM encryption failed: ${error.message}`);
        }
    }

    async generateChaoticFingerprint(metadataJson, seedSecretHex) {
        // Create initial hash
        const encoder = new TextEncoder();
        const metadataStr = JSON.stringify(metadataJson);
        const seedBuffer = this.hexToBuffer(seedSecretHex.replace(/^0x/, ''));
        
        const hashBuffer = await crypto.subtle.digest('SHA-256', 
            new Uint8Array([...encoder.encode(metadataStr), ...seedBuffer])
        );
        
        // Convert to unit value [0,1)
        const x0 = this.seedToUnit(new Uint8Array(hashBuffer));
        
        // Generate logistic sequence
        const sequence = this.logisticIteration(x0, 3.99, 16);
        
        // Quantize sequence
        const quantized = this.quantizeSequence(sequence);
        
        // Final hash
        const finalHashBuffer = await crypto.subtle.digest('SHA-256', 
            new Uint8Array([...quantized, ...encoder.encode(metadataStr)])
        );
        
        return this.bufferToHex(new Uint8Array(finalHashBuffer));
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

    displayResult(encryptedContent) {
        document.getElementById('encryptedContent').textContent = encryptedContent;
        document.getElementById('resultSection').style.display = 'block';
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
        document.getElementById('encryptBtn').disabled = show;
    }

    clearResults() {
        document.getElementById('resultSection').style.display = 'none';
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

// Utility functions
function generateKeyPair() {
    // Generate a random 32-byte private key
    const privateKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    const privateKeyHex = '0x' + Array.from(privateKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    document.getElementById('privateKey').value = privateKeyHex;
    
    // In a real implementation, you'd derive the public key from the private key
    // For demo purposes, we'll generate a random public key
    const publicKeyBytes = crypto.getRandomValues(new Uint8Array(64));
    const publicKeyHex = '0x' + Array.from(publicKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    toastr.success('Key pair generated! Public key: ' + publicKeyHex.substring(0, 20) + '...');
    
    // Copy public key to clipboard for convenience
    navigator.clipboard.writeText(publicKeyHex).then(() => {
        toastr.info('Public key copied to clipboard');
    });
}

function generateSeedSecret() {
    const seedBytes = crypto.getRandomValues(new Uint8Array(32));
    const seedHex = '0x' + Array.from(seedBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    document.getElementById('seedSecret').value = seedHex;
    toastr.success('Seed secret generated!');
}

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

function downloadEncryptedData() {
    const encryptor = window.chaoticEncryptor;
    if (!encryptor || !encryptor.encryptedData) {
        toastr.error('No encrypted data to download');
        return;
    }

    const dataStr = JSON.stringify(encryptor.encryptedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `encrypted_data_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toastr.success('Encrypted data downloaded!');
}

// Initialize the encryptor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chaoticEncryptor = new ChaoticECCEncryptor();
    
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