export default class StatsPanel {
    constructor(scene, visible = false, isMobile = false, paytable = null) {
        this.scene = scene;
        this.visible = visible;
        this.isMobile = isMobile;
        this.paytable = paytable;

        this.data = {
            spinCount:    0,
            totalBet:     0,
            totalWin:     0,
            hitCount:     0,
            winBuckets: [
                { label: '0',         min: -Infinity, max: 0 },
                { label: '0 - 1x',      min: 0,    max: 1    },
                { label: '1 - 2x',      min: 1,    max: 2    },
                { label: '2 - 5x',      min: 2,    max: 5    },
                { label: '5 - 10x',     min: 5,    max: 10   },
                { label: '10 - 20x',    min: 10,   max: 20   },
                { label: '20 - 30x',    min: 20,   max: 30   },
                { label: '30 - 50x',    min: 30,   max: 50   },
                { label: '50 - 100x',   min: 50,   max: 100  },
                { label: '100 - 200x',  min: 100,  max: 200  },
                { label: '200 - 500x',  min: 200,  max: 500  },
                { label: '500 - 1000x', min: 500,  max: 1000 },
                { label: '1000x +',     min: 1000, max: Infinity },
            ].map(b => ({ ...b, count: 0 })),
            meta: null
        };

        this.create();

        this.secondsRemaining = document.getElementById("stat-seconds-remaining");
    }

    create() {
        const screenW = this.isMobile ? 1080 : 1920;
        const panelWidth = this.isMobile ? screenW : 300;
        const panelHeight = this.isMobile ? 660 : 950;
        const x = 0;
        const y = 0;

        this.panel = this.scene.add.dom(x, y, null).createFromCache('stats-panel');
        this.panel.setOrigin(0, 0).setPosition(x, y);

        if (this.panel.node) {
            this.panel.node.style.width = `${panelWidth}px`;
            this.panel.node.style.height = `${panelHeight}px`;
            this.panel.node.style.overflow = 'hidden';
            this.panel.node.style.pointerEvents = 'none';
        }

        if (this.isMobile) {
            const panelEl = this.panel.node.querySelector('#stats-panel');
            if (panelEl) {
                panelEl.classList.add('mobile');
            }
        }

        this.scene.registry.set('statsPanel', this.panel);

        this._resolveElements();
        this._setVisible(this.visible);
        this._bindToggle();
    }

    _resolveElements() {
        const q = (id) => this.panel.node.querySelector(id);

        this.els = {
            spinCount:  q('#stat-spin-count'),
            totalBet:   q('#stat-total-bet'),
            totalWin:   q('#stat-total-win'),
            rtp:        q('#stat-rtp'),
            hitRate:    q('#stat-hit-rate'),
            avgHit:     q('#stat-avg-hit'),
            avgWin:     q('#stat-average-win'),
            sessionTime: q('#stat-session-time'),
            winBuckets: {
                x1:  q('#stat-win-1x'),
                x5:  q('#stat-win-5x'),
                x10: q('#stat-win-10x'),
                x15: q('#stat-win-15x'),
            },
            meta: q("#stat-session-meta"),
            paytableContent: q('#paytable-content')
        };
        
        this._refreshBuckets();
        this._bindTabs();
    }

    setMeta(fileName, playNumber){
        const string = `${fileName}.json: ${playNumber}`
        const newString = Array.from(string).map(c => c.charCodeAt(0).toString(16)).join('');
        this.data.meta = newString
    }

    _setVisible(visible) {
        const panelEl = this.panel.node.querySelector('#stats-panel');
        if (!panelEl) return;
        if (visible) {
            panelEl.classList.remove('collapsed');
            this.panel.setPosition(0, 0);
            this.panel.node.style.setProperty('pointer-events', 'auto', 'important');
        } else {
            panelEl.classList.add('collapsed');
            const offScreenY = this.isMobile ? -700 : -1000;
            this.panel.setPosition(0, offScreenY);
            this.panel.node.style.setProperty('pointer-events', 'none', 'important');
        }
    }

    setVisible(visible) {
        this.visible = visible;
        this._setVisible(visible);
    }

    toggle() {
        this.setVisible(!this.visible);
    }

    _bindToggle() {
        const panel = this.panel.node.querySelector('#stats-panel');
        if (!panel) return

        const reportBtn = this.panel.node.querySelector('#btn-report-play');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                const code = this.data.meta ?? '—';
                const confirmed = confirm('🚩 Do you want to report this play?');
                if (confirmed) {
                    navigator.clipboard.writeText(code);
                    alert(`Report code copied to clipboard: ${code}`);
                }
            });
        }
    }

    _bindTabs() {
        const tabs = this.panel.node.querySelectorAll('.stats-tab');
        const panels = this.panel.node.querySelectorAll('.tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                tabs.forEach(t => t.classList.toggle('active', t === tab));
                panels.forEach(p => {
                    p.classList.toggle('active', p.dataset.panel === targetTab);
                });

                if (targetTab === 'paytable' && !this._paytableRendered) {
                    this._renderPaytable();
                    this._paytableRendered = true;
                }

                if (targetTab === 'config' && !this._configBound) {
                    this._bindSoundControls();
                    this._configBound = true;
                }
            });
        });
    }

    _bindSoundControls() {
        const q = (id) => this.panel.node.querySelector(id);
        if (!q('#config-content')) return;

        const musicToggle = q('#config-music-toggle');
        const sfxToggle = q('#config-sfx-toggle');
        const musicVolume = q('#config-music-volume');
        const sfxVolume = q('#config-sfx-volume');

        // Use AudioManager
        const audio = this.scene.audioManager;
        if (!audio) return;

        // Initialize UI state from AudioManager
        if (musicToggle) {
            musicToggle.checked = audio.isMusicEnabled();
            musicToggle.addEventListener('change', () => {
                audio.setMusicEnabled(musicToggle.checked);
            });
        }

        if (sfxToggle) {
            sfxToggle.checked = audio.isSfxEnabled();
            sfxToggle.addEventListener('change', () => {
                audio.setSfxEnabled(sfxToggle.checked);
            });
        }

        if (musicVolume) {
            musicVolume.value = Math.round(audio.getMusicVolume() * 100);
            musicVolume.addEventListener('input', () => {
                audio.setMusicVolume(musicVolume.value / 100);
            });
        }

        if (sfxVolume) {
            sfxVolume.value = Math.round(audio.getSfxVolume() * 100);
            sfxVolume.addEventListener('input', () => {
                audio.setSfxVolume(sfxVolume.value / 100);
            });
        }
    }

    _renderPaytable() {
        if (!this.els.paytableContent) return;

        const paytable = this.paytable;
        if (!paytable || paytable.length === 0) {
            this.els.paytableContent.innerHTML = '<div class="paytable-empty">No paytable data available</div>';
            return;
        }

        this.els.paytableContent.innerHTML = paytable.map(entry => {
            if (entry.special) {
                return `
                    <div class="paytable-entry ${entry.tier}">
                        <div class="paytable-icon" data-symbol="${entry.texture}"></div>
                        <div class="paytable-info">
                            <div class="paytable-name">${entry.name}</div>
                            <div class="paytable-special">${entry.special}</div>
                        </div>
                    </div>
                `;
            }

            const payoutsHtml = Object.entries(entry.payouts)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([count, value]) => `
                    <div class="paytable-payout">
                        <span class="payout-count">${count}×</span>
                        <span class="payout-value">${value}×</span>
                    </div>
                `).join('');

            return `
                <div class="paytable-entry ${entry.tier}">
                    <div class="paytable-icon" data-symbol="${entry.texture}"></div>
                    <div class="paytable-info">
                        <div class="paytable-name">${entry.name}</div>
                    </div>
                    <div class="paytable-payouts">
                        ${payoutsHtml || `
                            <div class="paytable-payout">
                                <span class="payout-count">-</span>
                                <span class="payout-value">-</span>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        this._loadSymbolIcons();
    }

    _loadSymbolIcons() {
        const icons = this.panel.node.querySelectorAll('.paytable-icon[data-symbol]');
        if (icons.length === 0) return;

        const texture = this.scene.textures.get('symbols');
        if (!texture) return;

        icons.forEach(iconEl => {
            const frameName = iconEl.dataset.symbol;
            if (!frameName) return;

            const frame = texture.get(frameName);
            if (!frame) return;

            const img = this._frameToImage(texture.key, frameName);
            if (img) {
                iconEl.appendChild(img);
            }
        });
    }

    _frameToImage(atlasKey, frameName) {
        const texture = this.scene.textures.get(atlasKey);
        if (!texture) return null;

        const source = texture.getSourceImage();
        const frame = texture.get(frameName);
        if (!frame) return null;

        const canvas = document.createElement('canvas');
        canvas.width = frame.width;
        canvas.height = frame.height;
        const ctx = canvas.getContext('2d');

        const cutX = frame.cutX || 0;
        const cutY = frame.cutY || 0;

        try {
            ctx.drawImage(
                source,
                cutX, cutY, frame.width, frame.height,
                0, 0, frame.width, frame.height
            );
        } catch (e) {
            return null;
        }

        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.alt = frameName;
        return img;
    }

    registerSpin(betAmount) {
        this.data.spinCount++;
        this.data.totalBet += betAmount;
        this._set('spinCount', this.data.spinCount);
        this._set('totalBet',  this._dollars(this.data.totalBet));
    }

    registerWin(amount, betAmount) {
        this.data.totalWin += amount;

        if (amount > 0) {
            this.data.hitCount++;
            this._classifyWin(amount, betAmount);
        } else {
            this.data.winBuckets[0].count++;
            this._refreshBuckets();
        }

        this._refreshDerived();
    }

    _classifyWin(amount, betAmount) {
        if (betAmount === 0) return;
        const mult = amount / betAmount;

        const bucket = this.data.winBuckets.find(b => mult > b.min && mult <= b.max);
        if (bucket) {
            bucket.count++;
            this._refreshBuckets();
        }
    }

    _refreshBuckets() {
        const container = this.panel.node.querySelector('#stat-win-buckets');
        if (!container) return;

        container.innerHTML = this.data.winBuckets
            .map(b => `
                <div class="stat-row">
                    <span class="stat-row-label">${b.label}</span>
                    <span class="stat-row-value">${b.count}</span>
                </div>
            `).join('');
    }

    getRTP() {
        if (this.data.totalBet === 0) return 0;
        return (this.data.totalWin / this.data.totalBet) * 100;
    }

    getHitRate() {
        if (this.data.spinCount === 0) return 0;
        return (this.data.hitCount / this.data.spinCount) * 100;
    }

    getAvgHit() {
        if (this.data.hitCount === 0) return 0;
        return this.data.totalWin / this.data.hitCount;
    }

    getAvgWin() {
        if (this.data.spinCount === 0) return 0;
        return this.data.totalWin / this.data.spinCount;
    }

    _refreshDerived() {
        this._set('totalWin', this._dollars(this.data.totalWin));
        this._set('rtp',      this.getRTP().toFixed(2) + '%');
        this._set('hitRate',  this.getHitRate().toFixed(2) + '%');
        this._set('avgHit',   this._dollars(this.getAvgHit()));
        this._set('avgWin',   this._dollars(this.getAvgWin()));
    }

    reset() {
        this.data = {
            spinCount: 0,
            totalBet:  0,
            totalWin:  0,
            hitCount:  0,
            winBuckets: { x1: 0, x5: 0, x10: 0, x15: 0 },
        };

        this._set('spinCount',     0);
        this._set('totalBet',      '$0.00');
        this._set('totalWin',      '$0.00');
        this._set('rtp',           '—');
        this._set('hitRate',       '—');
        this._set('avgHit',        '$0.00');
        this._set('avgWin',        '$0.00');
        this._set('winBuckets.x1',  0);
        this._set('winBuckets.x5',  0);
        this._set('winBuckets.x10', 0);
        this._set('winBuckets.x15', 0);
    }

    updateSessionTimer(minutes, seconds) {
        const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this._set('sessionTime', formatted);
    }

    _set(key, value) {
        const parts = key.split('.');
        let el = this.els;
        for (const p of parts) el = el?.[p];
        if (el) el.innerText = value;
    }

    _dollars(cents) {
        return '$' + (cents / 100).toFixed(2);
    }
}