// Adaptive Speech Feedback System
// Adjusts voice parameters based on context, emotion, and user patterns

export interface VoiceProfile {
  id: string;
  name: string;
  rate: number; // 0.5 - 2.0
  pitch: number; // 0 - 2
  volume: number; // 0 - 1
  emphasis: 'normal' | 'reduced' | 'strong';
  language: string;
  voiceURI?: string;
}

export interface SpeechContext {
  type: 'greeting' | 'information' | 'warning' | 'error' | 'success' | 'question' | 'confirmation' | 'casual';
  urgency: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  userMood?: 'neutral' | 'happy' | 'frustrated' | 'confused' | 'excited';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  responseLength: 'short' | 'medium' | 'long';
}

export interface UserPreferences {
  preferredSpeed: number;
  preferredPitch: number;
  preferredVolume: number;
  voiceGender?: 'male' | 'female' | 'neutral';
  accentPreference?: string;
  pauseDuration: number; // milliseconds between sentences
  enableEmotionalResponse: boolean;
}

export interface EmotionDetection {
  confidence: number;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'confused';
  energy: number; // 0-1 scale
  speakingRate: 'slow' | 'normal' | 'fast';
}

// Predefined voice profiles for different contexts
const VOICE_PROFILES: Record<string, VoiceProfile> = {
  // Friendly assistant - default
  friendly: {
    id: 'friendly',
    name: 'Vennlig Assistent',
    rate: 1.0,
    pitch: 1.1,
    volume: 0.85,
    emphasis: 'normal',
    language: 'nb-NO'
  },
  
  // Professional - for business/formal contexts
  professional: {
    id: 'professional',
    name: 'Profesjonell',
    rate: 0.95,
    pitch: 1.0,
    volume: 0.9,
    emphasis: 'reduced',
    language: 'nb-NO'
  },
  
  // Excited - for positive feedback and achievements
  excited: {
    id: 'excited',
    name: 'Entusiastisk',
    rate: 1.15,
    pitch: 1.3,
    volume: 0.95,
    emphasis: 'strong',
    language: 'nb-NO'
  },
  
  // Calm - for error messages or complex explanations
  calm: {
    id: 'calm',
    name: 'Rolig',
    rate: 0.85,
    pitch: 0.95,
    volume: 0.8,
    emphasis: 'reduced',
    language: 'nb-NO'
  },
  
  // Quick - for brief confirmations
  quick: {
    id: 'quick',
    name: 'Rask',
    rate: 1.25,
    pitch: 1.05,
    volume: 0.85,
    emphasis: 'normal',
    language: 'nb-NO'
  },
  
  // Supportive - for help and guidance
  supportive: {
    id: 'supportive',
    name: 'Støttende',
    rate: 0.9,
    pitch: 1.15,
    volume: 0.88,
    emphasis: 'normal',
    language: 'nb-NO'
  }
};

export class AdaptiveSpeechSystem {
  private userPreferences: UserPreferences;
  private currentProfile: VoiceProfile;
  private speechHistory: Array<{ context: SpeechContext, timestamp: Date, duration: number }> = [];
  private emotionHistory: EmotionDetection[] = [];
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  
  constructor() {
    this.userPreferences = this.loadUserPreferences();
    this.currentProfile = VOICE_PROFILES.friendly;
    this.initializeSpeech();
  }
  
  private initializeSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      
      // Load available voices
      const loadVoices = () => {
        this.voices = this.synth?.getVoices() || [];
      };
      
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }
  
  private loadUserPreferences(): UserPreferences {
    const stored = localStorage.getItem('adaptiveSpeechPrefs');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default preferences
    return {
      preferredSpeed: 1.0,
      preferredPitch: 1.0,
      preferredVolume: 0.85,
      pauseDuration: 300,
      enableEmotionalResponse: true
    };
  }
  
  public saveUserPreferences(prefs: Partial<UserPreferences>) {
    this.userPreferences = { ...this.userPreferences, ...prefs };
    localStorage.setItem('adaptiveSpeechPrefs', JSON.stringify(this.userPreferences));
  }
  
  // Analyze text to determine appropriate context
  public analyzeTextContext(text: string): SpeechContext {
    const lowerText = text.toLowerCase();
    const wordCount = text.split(' ').length;
    
    // Determine type based on content
    let type: SpeechContext['type'] = 'information';
    let urgency: SpeechContext['urgency'] = 'medium';
    
    if (lowerText.includes('feil') || lowerText.includes('error') || lowerText.includes('problem')) {
      type = 'error';
      urgency = 'high';
    } else if (lowerText.includes('gratulerer') || lowerText.includes('ferdig') || lowerText.includes('suksess')) {
      type = 'success';
      urgency = 'low';
    } else if (text.includes('?')) {
      type = 'question';
    } else if (lowerText.includes('hei') || lowerText.includes('velkommen')) {
      type = 'greeting';
      urgency = 'low';
    } else if (lowerText.includes('advarsel') || lowerText.includes('obs') || lowerText.includes('viktig')) {
      type = 'warning';
      urgency = 'high';
    } else if (lowerText.includes('ok') || lowerText.includes('forstått') || lowerText.includes('bekreftet')) {
      type = 'confirmation';
      urgency = 'low';
    }
    
    // Determine complexity based on length and content
    let complexity: SpeechContext['complexity'] = 'simple';
    if (wordCount > 30) complexity = 'complex';
    else if (wordCount > 10) complexity = 'moderate';
    
    // Determine response length
    let responseLength: SpeechContext['responseLength'] = 'short';
    if (wordCount > 50) responseLength = 'long';
    else if (wordCount > 20) responseLength = 'medium';
    
    // Get time of day
    const hour = new Date().getHours();
    let timeOfDay: SpeechContext['timeOfDay'] = 'afternoon';
    if (hour < 6) timeOfDay = 'night';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';
    
    return {
      type,
      urgency,
      complexity,
      responseLength,
      timeOfDay
    };
  }
  
  // Select appropriate voice profile based on context
  public selectVoiceProfile(context: SpeechContext): VoiceProfile {
    // Map context to appropriate profile
    if (context.type === 'error' || context.type === 'warning') {
      return VOICE_PROFILES.calm;
    } else if (context.type === 'success') {
      return VOICE_PROFILES.excited;
    } else if (context.type === 'greeting') {
      return VOICE_PROFILES.friendly;
    } else if (context.type === 'confirmation' && context.responseLength === 'short') {
      return VOICE_PROFILES.quick;
    } else if (context.complexity === 'complex') {
      return VOICE_PROFILES.supportive;
    } else if (context.urgency === 'high') {
      return VOICE_PROFILES.professional;
    }
    
    return VOICE_PROFILES.friendly;
  }
  
  // Detect emotion from user's speech input
  public detectEmotion(audioFeatures?: { pitch?: number, rate?: number, volume?: number }): EmotionDetection {
    // Simple emotion detection based on speech features
    // In a real implementation, this would use ML models
    
    const avgPitch = audioFeatures?.pitch || 1.0;
    const avgRate = audioFeatures?.rate || 1.0;
    const avgVolume = audioFeatures?.volume || 0.5;
    
    let emotion: EmotionDetection['emotion'] = 'neutral';
    let confidence = 0.5;
    let energy = avgVolume;
    let speakingRate: EmotionDetection['speakingRate'] = 'normal';
    
    // Determine speaking rate
    if (avgRate < 0.85) speakingRate = 'slow';
    else if (avgRate > 1.15) speakingRate = 'fast';
    
    // Simple emotion heuristics
    if (avgPitch > 1.2 && avgVolume > 0.7) {
      emotion = 'excited' as any || 'happy';
      confidence = 0.7;
    } else if (avgPitch < 0.9 && avgVolume < 0.4) {
      emotion = 'sad';
      confidence = 0.6;
    } else if (avgVolume > 0.8 && avgRate > 1.2) {
      emotion = 'angry';
      confidence = 0.65;
    } else if (avgRate < 0.8) {
      emotion = 'confused';
      confidence = 0.55;
    }
    
    const detection = { confidence, emotion, energy, speakingRate };
    this.emotionHistory.push(detection);
    
    // Keep only last 10 detections
    if (this.emotionHistory.length > 10) {
      this.emotionHistory.shift();
    }
    
    return detection;
  }
  
  // Adapt voice based on user's emotional state
  public adaptToUserEmotion(profile: VoiceProfile, emotion: EmotionDetection): VoiceProfile {
    if (!this.userPreferences.enableEmotionalResponse) {
      return profile;
    }
    
    const adapted = { ...profile };
    
    switch (emotion.emotion) {
      case 'confused':
        // Slow down and be clearer
        adapted.rate *= 0.85;
        adapted.pitch *= 0.95;
        break;
      
      case 'angry':
        // Be calmer and more supportive
        adapted.rate *= 0.9;
        adapted.pitch *= 0.9;
        adapted.volume *= 0.95;
        break;
      
      case 'happy':
        // Match their energy
        adapted.rate *= 1.05;
        adapted.pitch *= 1.05;
        break;
      
      case 'sad':
        // Be more gentle
        adapted.rate *= 0.95;
        adapted.pitch *= 1.02;
        adapted.volume *= 0.9;
        break;
    }
    
    return adapted;
  }
  
  // Generate speech with adaptive parameters
  public async speak(text: string, context?: SpeechContext, userEmotion?: EmotionDetection): Promise<void> {
    if (!this.synth) return;
    
    // Cancel any ongoing speech
    this.synth.cancel();
    
    // Analyze context if not provided
    const speechContext = context || this.analyzeTextContext(text);
    
    // Select appropriate voice profile
    let profile = this.selectVoiceProfile(speechContext);
    
    // Adapt based on user emotion if detected
    if (userEmotion) {
      profile = this.adaptToUserEmotion(profile, userEmotion);
    }
    
    // Apply user preferences
    profile = this.applyUserPreferences(profile);
    
    // Split text into sentences for better pacing
    const sentences = this.splitIntoSentences(text);
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      const utterance = new SpeechSynthesisUtterance(sentence);
      
      // Apply voice parameters
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = profile.volume;
      utterance.lang = profile.language;
      
      // Select best matching voice
      const voice = this.selectBestVoice(profile.language);
      if (voice) {
        utterance.voice = voice;
      }
      
      // Add emphasis for important words
      if (profile.emphasis === 'strong') {
        utterance.rate *= 0.95; // Slightly slower for emphasis
      }
      
      // Speak the sentence
      await this.speakUtterance(utterance);
      
      // Add pause between sentences (except for last one)
      if (i < sentences.length - 1) {
        await this.pause(this.userPreferences.pauseDuration);
      }
    }
    
    // Record speech history
    this.speechHistory.push({
      context: speechContext,
      timestamp: new Date(),
      duration: sentences.length * 2000 // Rough estimate
    });
    
    // Keep only last 50 entries
    if (this.speechHistory.length > 50) {
      this.speechHistory = this.speechHistory.slice(-50);
    }
  }
  
  private applyUserPreferences(profile: VoiceProfile): VoiceProfile {
    return {
      ...profile,
      rate: profile.rate * this.userPreferences.preferredSpeed,
      pitch: profile.pitch * this.userPreferences.preferredPitch,
      volume: profile.volume * this.userPreferences.preferredVolume
    };
  }
  
  private selectBestVoice(language: string): SpeechSynthesisVoice | null {
    // Try to find a voice matching the language
    const norwegianVoices = this.voices.filter(v => v.lang.startsWith('nb') || v.lang.startsWith('no'));
    
    if (norwegianVoices.length > 0) {
      // Prefer female voices based on user preference
      if (this.userPreferences.voiceGender === 'female') {
        const femaleVoice = norwegianVoices.find(v => v.name.includes('female') || v.name.includes('Female'));
        if (femaleVoice) return femaleVoice;
      }
      
      return norwegianVoices[0];
    }
    
    // Fallback to any available voice
    return this.voices[0] || null;
  }
  
  private splitIntoSentences(text: string): string[] {
    // Split by sentence endings, keeping the punctuation
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }
  
  private speakUtterance(utterance: SpeechSynthesisUtterance): Promise<void> {
    return new Promise((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synth?.speak(utterance);
    });
  }
  
  private pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Learn from user interactions
  public learnFromFeedback(wasHelpful: boolean, context: SpeechContext) {
    // Adjust preferences based on feedback
    if (!wasHelpful && context.complexity === 'complex') {
      // User had trouble understanding - slow down
      this.saveUserPreferences({
        preferredSpeed: Math.max(0.7, this.userPreferences.preferredSpeed - 0.05)
      });
    } else if (wasHelpful && context.responseLength === 'short') {
      // User understood quick responses - can speed up slightly
      this.saveUserPreferences({
        preferredSpeed: Math.min(1.3, this.userPreferences.preferredSpeed + 0.02)
      });
    }
  }
  
  // Get speech analytics
  public getAnalytics() {
    const recentHistory = this.speechHistory.slice(-20);
    
    const avgComplexity = recentHistory.reduce((acc, h) => {
      const complexity = h.context.complexity === 'simple' ? 1 : h.context.complexity === 'moderate' ? 2 : 3;
      return acc + complexity;
    }, 0) / (recentHistory.length || 1);
    
    const mostCommonType = this.getMostCommonType(recentHistory.map(h => h.context.type));
    const avgResponseLength = this.getAverageResponseLength(recentHistory);
    
    return {
      avgComplexity,
      mostCommonType,
      avgResponseLength,
      totalSpeechEvents: this.speechHistory.length,
      recentEmotions: this.emotionHistory.slice(-5)
    };
  }
  
  private getMostCommonType(types: string[]): string {
    const counts: Record<string, number> = {};
    types.forEach(type => {
      counts[type] = (counts[type] || 0) + 1;
    });
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'information';
  }
  
  private getAverageResponseLength(history: typeof this.speechHistory): string {
    const lengths = history.map(h => h.context.responseLength);
    const counts = { short: 0, medium: 0, long: 0 };
    
    lengths.forEach(length => {
      counts[length]++;
    });
    
    if (counts.long > counts.medium && counts.long > counts.short) return 'long';
    if (counts.short > counts.medium) return 'short';
    return 'medium';
  }
}

// Export singleton instance
export const adaptiveSpeech = new AdaptiveSpeechSystem();