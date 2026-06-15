// ============================================================
// PLACEHOLDER: החלף כאן את קישור קובץ האודיו האמיתי
// קובץ: client/src/hooks/useSuccessSound.js  שורה: 7
// לדוגמה: '/sounds/success-click.mp3'
// ============================================================
const SUCCESS_SOUND_URL = '/sounds/denielcz-immersivecontrol-button-click-sound-463065.mp3';

export function useSuccessSound() {
    const play = () => {
        try {
            const audio = new Audio(SUCCESS_SOUND_URL);
            audio.volume = 0.4;
            audio.play().catch(() => {
                // הדפדפן חסם autoplay — לא קריטי
            });
        } catch {
            // Audio API לא זמין
        }
    };
    return play;
}
