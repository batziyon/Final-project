// מקור אמת אחד לכל ערכי הבחירה במערכת

export const CATEGORIES = [
    { value: 'פיתוח',  label: '💻 פיתוח' },
    { value: 'עיצוב',  label: '🎨 עיצוב' },
    { value: 'AI',     label: '🤖 AI' },
    { value: 'עסקים',  label: '💼 עסקים' },
    { value: 'חינוך',  label: '📚 חינוך' },
    { value: 'בריאות', label: '🏥 בריאות' },
    { value: 'אחר',    label: '✏️ אחר' },
];

export const MATURITY_LEVELS = [
    { value: 'idea',   label: '💡 רעיון' },
    { value: 'mvp',    label: '🔧 MVP' },
    { value: 'active', label: '🚀 פעיל' },
];

export const LOCATION_TYPES = [
    { value: 'remote',   label: '🌐 מרחוק' },
    { value: 'physical', label: '📍 פיזי' },
];

export const PAYMENT_TYPES = [
    { value: 'unpaid', label: '🤝 התנדבות' },
    { value: 'paid',   label: '💰 בתשלום' },
];
