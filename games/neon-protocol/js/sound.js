// Sound Manager using Web Audio API
// サイバーパンク風のプロシージャルオーディオ生成

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.bgmOscillators = [];
        this.isMuted = false;
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.4;
        this.isPlayingBGM = false;

        // BGMのシーケンスデータ (簡易的なベースライン)
        this.bassSequence = [
            { note: 36, duration: 0.2 }, // C2
            { note: 36, duration: 0.2 },
            { note: 39, duration: 0.2 }, // Eb2
            { note: 36, duration: 0.2 },
            { note: 41, duration: 0.2 }, // F2
            { note: 36, duration: 0.2 },
            { note: 43, duration: 0.2 }, // G2
            { note: 39, duration: 0.2 }  // Eb2
        ];

        // コード進行 (C Minor: Cm - Ab - Fm - G)
        this.chordSequence = [
            [48, 51, 55], // Cm (C3, Eb3, G3)
            [44, 48, 51], // Ab (Ab2, C3, Eb3)
            [41, 44, 48], // Fm (F2, Ab2, C3)
            [43, 47, 50]  // G  (G2, B2, D3)
        ];

        this.currentNoteIndex = 0;
        this.currentChordIndex = 0;
        this.nextNoteTime = 0;
        this.tempo = 110;
        this.beatCount = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
        }

        // ユーザーインタラクション後にAudioContextを再開する必要がある場合がある
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 周波数変換
    noteToFreq(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    // === SFX (効果音) ===

    // 汎用的なシンセ音生成
    playTone(freq, type, duration, volume = 1, slideFreq = null) {
        if (!this.ctx || this.isMuted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // ノイズ生成（爆発音や打撃音用）
    playNoise(duration, volume = 1) {
        if (!this.ctx || this.isMuted) return;
        this.init();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    }

    // UI: ホバー音
    playHover() {
        this.playTone(800, 'sine', 0.05, 0.1);
    }

    // UI: クリック音
    playClick() {
        this.playTone(1200, 'square', 0.1, 0.2, 600);
    }

    // カード: ドロー
    playDraw() {
        this.playTone(400, 'sine', 0.1, 0.3, 800);
    }

    // カード: プレイ（使用）
    playCard() {
        this.playTone(600, 'sawtooth', 0.2, 0.3, 1200);
        setTimeout(() => this.playTone(1200, 'sine', 0.3, 0.2, 400), 100);
    }

    // 戦闘: 攻撃
    playAttack() {
        this.playNoise(0.2, 0.5);
        this.playTone(200, 'sawtooth', 0.2, 0.4, 50);
    }

    // 戦闘: ダメージを受ける
    playDamage() {
        this.playNoise(0.4, 0.6);
        this.playTone(100, 'square', 0.3, 0.5, 20);
    }

    // 戦闘: 防御/シールド
    playShield() {
        this.playTone(300, 'sine', 0.4, 0.3, 600);
        this.playTone(400, 'sine', 0.4, 0.3, 800);
    }

    // 戦闘: バフ/デバフ
    playBuff() {
        this.playTone(400, 'triangle', 0.5, 0.3, 800);
    }

    // 戦闘: デバフ
    playDebuff() {
        this.playTone(300, 'triangle', 0.5, 0.3, 100); // Lower pitch for debuffs
    }


    // 戦闘: 打撃音
    playHit() {
        this.playNoise(0.15, 0.4);
        this.playTone(150, 'square', 0.15, 0.4, 50);
    }

    // 戦闘: 爆発音
    playExplosion() {
        this.playNoise(0.5, 0.7);
        this.playTone(80, 'sawtooth', 0.4, 0.5, 20);
        setTimeout(() => this.playTone(40, 'square', 0.3, 0.3, 10), 100);
    }

    // ゲーム: 勝利
    playVictory() {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { // C Major Arpeggio
            setTimeout(() => this.playTone(freq, 'square', 0.4, 0.4), i * 150);
        });
    }

    // ゲーム: ゲームオーバー
    playGameOver() {
        this.playTone(300, 'sawtooth', 1.0, 0.5, 50);
        this.playNoise(1.0, 0.4);
    }

    // 進化
    playEvolution() {
        this.playNoise(1.5, 0.5);
        let freq = 100;
        const interval = setInterval(() => {
            freq += 50;
            this.playTone(freq, 'sawtooth', 0.1, 0.3);
            if (freq > 1000) clearInterval(interval);
        }, 50);
    }

    // === BGM (簡易シーケンサー) ===

    startBGM() {
        if (this.isPlayingBGM || this.isMuted) return;
        this.init();
        this.isPlayingBGM = true;
        this.nextNoteTime = this.ctx.currentTime;
        this.scheduleNote();
    }

    stopBGM() {
        this.isPlayingBGM = false;
        clearTimeout(this.timerID);
    }

    scheduleNote() {
        if (!this.isPlayingBGM) return;

        const secondsPerBeat = 60.0 / this.tempo;
        const lookahead = 25.0; // ms

        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playBGMNote(this.nextNoteTime);

            // コード演奏 (4拍ごとに変更)
            if (this.beatCount % 8 === 0) {
                this.playChord(this.nextNoteTime);
                this.currentChordIndex = (this.currentChordIndex + 1) % this.chordSequence.length;
            }

            // 次のノートへ（8分音符）
            this.nextNoteTime += 0.5 * secondsPerBeat;
            this.currentNoteIndex++;
            this.beatCount++;

            if (this.currentNoteIndex >= this.bassSequence.length) {
                this.currentNoteIndex = 0;
            }
        }

        this.timerID = setTimeout(() => this.scheduleNote(), lookahead);
    }

    playBGMNote(time) {
        const noteData = this.bassSequence[this.currentNoteIndex];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = this.noteToFreq(noteData.note - 12); // 1オクターブ下

        // フィルターエンベロープ（Pluck sound）
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.3);

        gain.gain.setValueAtTime(this.bgmVolume * 0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.3);

        // ハイハット的なノイズ（4回に1回）
        if (this.currentNoteIndex % 2 === 0) {
            this.playHiHat(time);
        }
        // キック（4回に1回、頭拍）
        if (this.currentNoteIndex % 4 === 0) {
            this.playKick(time);
        }
    }

    playHiHat(time) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.bgmVolume * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time);
    }

    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(this.bgmVolume * 0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    playChord(time) {
        const chord = this.chordSequence[this.currentChordIndex];
        chord.forEach((note, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = this.noteToFreq(note);

            // Pad sound envelope
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(this.bgmVolume * 0.15, time + 0.5);
            gain.gain.setValueAtTime(this.bgmVolume * 0.15, time + 1.5); // Sustain
            gain.gain.linearRampToValueAtTime(0, time + 2.0); // Release

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(time);
            osc.stop(time + 2.0);
        });
    }

    // ゲーム: 勝利
    playVictory() {
        const now = this.ctx.currentTime;
        // Fanfare
        [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'square', 0.2, 0.4);
                this.playTone(freq * 0.5, 'sawtooth', 0.2, 0.2); // Bass layer
            }, i * 120);
        });

        // Final chord
        setTimeout(() => {
            [523.25, 659.25, 783.99, 1046.50].forEach(freq => {
                this.playTone(freq, 'triangle', 1.0, 0.3);
            });
        }, 800);
    }

    // ゲーム: ゲームオーバー
    playGameOver() {
        this.playTone(300, 'sawtooth', 1.5, 0.5, 50); // Downward slide
        this.playNoise(1.5, 0.4);

        // Dissonant chord
        setTimeout(() => {
            [200, 230, 280].forEach(freq => {
                this.playTone(freq, 'sawtooth', 1.0, 0.3);
            });
        }, 500);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBGM();
            if (this.masterGain) this.masterGain.gain.value = 0;
        } else {
            if (this.masterGain) this.masterGain.gain.value = 0.5;
            this.startBGM();
        }
        return this.isMuted;
    }
}

// グローバルインスタンス
const soundManager = new SoundManager();
