// Web Speech API - Read aloud functionality

class SpeechReader {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.isReading = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.currentSection = null;
    this.speechToggleBtn = document.querySelector('.speech-toggle-btn');
    
    if (this.isSupported) {
      this.setupUI();
      this.setupEventListeners();
      // Show toggle button since speech is supported
      if (this.speechToggleBtn) {
        this.speechToggleBtn.style.display = 'block';
      }
    } else {
      // Hide button if not supported
      if (this.speechToggleBtn) {
        this.speechToggleBtn.style.display = 'none';
      }
    }
  }

  setupUI() {
    // Find or create speech controls panel
    this.controlsEl = document.getElementById('speech-controls') || this.createControlsPanel();
    this.toggleBtn = this.controlsEl.querySelector('[data-speech-toggle]');
    this.pauseBtn = this.controlsEl.querySelector('[data-speech-pause]');
    this.stopBtn = this.controlsEl.querySelector('[data-speech-stop]');
    this.speedInput = this.controlsEl.querySelector('[data-speech-speed]');
    this.voiceSelect = this.controlsEl.querySelector('[data-speech-voice]');
    this.statusEl = this.controlsEl.querySelector('.speech-status');
  }

  createControlsPanel() {
    const panel = document.createElement('div');
    panel.id = 'speech-controls';
    panel.className = 'speech-controls';
    panel.innerHTML = `
      <div class="speech-controls-inner">
        <button data-speech-toggle class="speech-btn speech-toggle" aria-label="Start reading">
          <span class="speech-icon">🔊</span>
          <span class="speech-text">Read Aloud</span>
        </button>
        <button data-speech-pause class="speech-btn speech-pause" aria-label="Pause reading" disabled>
          <span class="speech-icon">⏸</span>
        </button>
        <button data-speech-stop class="speech-btn speech-stop" aria-label="Stop reading" disabled>
          <span class="speech-icon">⏹</span>
        </button>
        <div class="speech-controls-group">
          <label for="speech-speed">Speed:</label>
          <input 
            type="range" 
            id="speech-speed" 
            data-speech-speed 
            min="0.5" 
            max="2" 
            step="0.1" 
            value="1"
            aria-label="Reading speed"
          />
        </div>
        <div class="speech-controls-group">
          <label for="speech-voice">Voice:</label>
          <select id="speech-voice" data-speech-voice aria-label="Voice selection">
            <option value="">Default</option>
          </select>
        </div>
        <div class="speech-status">Ready to read</div>
      </div>
    `;
    
    // Insert after header
    const header = document.querySelector('.page-header');
    header.parentNode.insertBefore(panel, header.nextSibling);
    
    return panel;
  }

  setupEventListeners() {
    // Header button - toggle the panel visibility
    if (this.speechToggleBtn) {
      this.speechToggleBtn.addEventListener('click', () => {
        this.controlsEl.classList.toggle('active');
      });
    }

    // Toggle button in panel - reads the current visible section
    this.toggleBtn?.addEventListener('click', () => {
      if (this.isReading) {
        this.stop();
      } else {
        this.startReading();
      }
    });

    // Pause button
    this.pauseBtn?.addEventListener('click', () => {
      if (this.isPaused) {
        this.synth.resume();
        this.isPaused = false;
        this.pauseBtn.innerHTML = '<span class="speech-icon">⏸</span>';
        this.updateStatus('Resumed');
      } else {
        this.synth.pause();
        this.isPaused = true;
        this.pauseBtn.innerHTML = '<span class="speech-icon">▶</span>';
        this.updateStatus('Paused');
      }
    });

    // Stop button
    this.stopBtn?.addEventListener('click', () => {
      this.stop();
    });

    // Speed control
    this.speedInput?.addEventListener('change', (e) => {
      if (this.currentUtterance) {
        this.currentUtterance.rate = parseFloat(e.target.value);
      }
    });

    // Voice selection
    this.voiceSelect?.addEventListener('change', (e) => {
      if (this.currentUtterance && e.target.value) {
        this.currentUtterance.voice = this.synth.getVoices()[e.target.value];
      }
    });

    // Populate voices (may be async)
    this.populateVoices();
    this.synth.addEventListener('voiceschanged', () => this.populateVoices());

    // Listen for speech events
    this.synth.addEventListener('end', () => {
      this.isReading = false;
      this.toggleBtn.innerHTML = '<span class="speech-icon">🔊</span><span class="speech-text">Read Aloud</span>';
      this.pauseBtn.disabled = true;
      this.stopBtn.disabled = true;
      this.updateStatus('Finished');
    });
  }

  populateVoices() {
    if (!this.voiceSelect) return;
    
    const voices = this.synth.getVoices();
    this.voiceSelect.innerHTML = '<option value="">Default</option>';
    
    voices.forEach((voice, idx) => {
      const option = document.createElement('option');
      option.value = idx;
      option.textContent = `${voice.name} (${voice.lang})`;
      this.voiceSelect.appendChild(option);
    });
  }

  startReading() {
    this.synth.cancel();
    
    // Get all readable content from accordions and sections
    const sections = [];
    document.querySelectorAll('.accordion-content section').forEach(section => {
      const h3 = section.querySelector('h3, h4');
      const heading = h3 ? h3.textContent : 'Section';
      const content = section.textContent.replace(/\n+/g, ' ').trim();
      
      if (content) {
        sections.push(`${heading}. ${content}`);
      }
    });

    if (sections.length === 0) {
      this.updateStatus('No content to read');
      return;
    }

    const fullText = sections.join('. ');
    this.readText(fullText);
  }

  readText(text) {
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = parseFloat(this.speedInput?.value || 1);
    this.currentUtterance.pitch = 1;
    this.currentUtterance.volume = 1;

    if (this.voiceSelect?.value) {
      const voices = this.synth.getVoices();
      this.currentUtterance.voice = voices[this.voiceSelect.value];
    }

    this.currentUtterance.addEventListener('start', () => {
      this.isReading = true;
      this.isPaused = false;
      this.toggleBtn.innerHTML = '<span class="speech-icon">🔊</span><span class="speech-text">Stop</span>';
      this.pauseBtn.disabled = false;
      this.stopBtn.disabled = false;
      this.updateStatus('Reading...');
    });

    this.currentUtterance.addEventListener('end', () => {
      this.isReading = false;
      this.toggleBtn.innerHTML = '<span class="speech-icon">🔊</span><span class="speech-text">Read Aloud</span>';
      this.pauseBtn.disabled = true;
      this.stopBtn.disabled = true;
      this.updateStatus('Finished');
    });

    this.synth.speak(this.currentUtterance);
  }

  stop() {
    this.synth.cancel();
    this.isReading = false;
    this.isPaused = false;
    this.toggleBtn.innerHTML = '<span class="speech-icon">🔊</span><span class="speech-text">Read Aloud</span>';
    this.pauseBtn.innerHTML = '<span class="speech-icon">⏸</span>';
    this.pauseBtn.disabled = true;
    this.stopBtn.disabled = true;
    this.updateStatus('Stopped');
  }

  updateStatus(message) {
    if (this.statusEl) {
      this.statusEl.textContent = message;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if ('speechSynthesis' in window) {
    new SpeechReader();
  }
});
