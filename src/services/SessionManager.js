export default class SessionManager {

    constructor() {
        this.inactivityTimer = null;
        this.countdownTimer = null;
        this.inactivityMinutes = 5;

        this.onTimeoutCallback = null;
        this.onTickCallback = null;
    }

    startInactivityTimer(onTimeout, minutes = 5, onTick = null) {
        this.onTimeoutCallback = onTimeout;
        this.onTickCallback = onTick;
        this.inactivityMinutes = minutes;

        this.resetInactivityTimer();
    }

    resetInactivityTimer() {
        this.clearInactivityTimer();

        let remainingSeconds = this.inactivityMinutes * 60;

        this._notifyTick(remainingSeconds);

        this.countdownTimer = setInterval(() => {
            remainingSeconds--;

            this._notifyTick(remainingSeconds);
        }, 1000);

        this.inactivityTimer = setTimeout(() => {
            this.handleTimeout();
        }, remainingSeconds * 1000);
    }

    _notifyTick(remainingSeconds) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        if (this.onTickCallback) {
            this.onTickCallback(minutes, seconds);
        }
    }

    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }

        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    async handleTimeout() {
        this.clearInactivityTimer();

        console.log('Session expired by inactivity');

        if (this.onTimeoutCallback) {
            this.onTimeoutCallback();
        }
    }
}
