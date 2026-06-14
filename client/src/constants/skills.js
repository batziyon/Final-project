export const SKILLS_TREE = [
    {
        key: 'dev',
        label: '💻 פיתוח',
        sub: [
            'Frontend', 'Backend', 'Full Stack',
            'React', 'Next.js', 'Node.js', 'Python', 'Java',
            'Mobile Development', 'Flutter', 'React Native',
            'DevOps', 'AI/ML', 'Database'
        ]
    },
    {
        key: 'design',
        label: '🎨 עיצוב',
        sub: [
            'UI Design', 'UX Design', 'Graphic Design',
            'Branding', 'Figma', 'Illustrator', 'Photoshop'
        ]
    },
    {
        key: 'marketing',
        label: '📢 שיווק',
        sub: [
            'Social Media', 'SEO', 'PPC', 'Google Ads',
            'Facebook Ads', 'Email Marketing', 'Content Marketing',
            'Growth Marketing'
        ]
    },
    {
        key: 'content',
        label: '✍️ כתיבת תוכן',
        sub: [
            'Copywriting', 'Blogging', 'Technical Writing',
            'Content Strategy'
        ]
    },
    {
        key: 'product',
        label: '📋 ניהול מוצר',
        sub: [
            'Product Management', 'Agile', 'Scrum',
            'Jira', 'Roadmap', 'User Research'
        ]
    },
    {
        key: 'data',
        label: '📊 דאטה ואנליטיקה',
        sub: [
            'Data Analysis', 'SQL', 'Python',
            'Tableau', 'Power BI', 'Machine Learning'
        ]
    },
    {
        key: 'qa',
        label: '🧪 QA ובדיקות',
        sub: [
            'Manual Testing', 'Automation Testing',
            'Selenium', 'Cypress'
        ]
    },
    {
        key: 'sales',
        label: '💼 מכירות',
        sub: [
            'B2B Sales', 'B2C Sales', 'Business Development',
            'CRM'
        ]
    },
    {
        key: 'support',
        label: '🎧 שירות לקוחות',
        sub: ['Customer Support', 'Community Management']
    },
    {
        key: 'other',
        label: '✏️ אחר',
        sub: []
    }
];

// לשימוש ב-RoleSelector בפרויקט - אותו מבנה
export const ROLES_TREE = SKILLS_TREE;
