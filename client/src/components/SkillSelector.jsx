import React, { useState } from 'react';
import { SKILLS_TREE } from '../constants/skills';
import '../styles/components/SkillSelector.css';

const SkillSelector = ({ selected = [], onChange, label = 'מה אני יודע לעשות' }) => {
    const [openCategory, setOpenCategory] = useState(null);
    const [otherText, setOtherText] = useState('');

    const toggleCategory = (key) => setOpenCategory(prev => prev === key ? null : key);

    const toggleSub = (sub) => {
        onChange(selected.includes(sub)
            ? selected.filter(s => s !== sub)
            : [...selected, sub]);
    };

    const handleOther = (val) => {
        setOtherText(val);
        const filtered = selected.filter(s => !s.startsWith('אחר:'));
        onChange(val.trim() ? [...filtered, `אחר:${val.trim()}`] : filtered);
    };

    const isCategoryActive = (cat) =>
        cat.sub.some(s => selected.includes(s)) ||
        (cat.key === 'other' && selected.some(s => s.startsWith('אחר:')));

    const getCategoryCount = (cat) =>
        cat.key === 'other'
            ? selected.filter(s => s.startsWith('אחר:')).length
            : cat.sub.filter(s => selected.includes(s)).length;

    const getSkillLabel = (s) => s.startsWith('אחר:') ? s.replace('אחר:', '') : s;

    return (
        <div className="skill-selector">
            <div className="skill-selector-header">
                <label className="skill-selector-label">{label}</label>
                {selected.length > 0 && (
                    <span className="skill-selected-count">{selected.length} נבחרו</span>
                )}
            </div>

            <div className="skill-categories">
                {SKILLS_TREE.map(cat => {
                    const active = isCategoryActive(cat);
                    const isOpen = openCategory === cat.key;
                    const count = getCategoryCount(cat);
                    return (
                        <div key={cat.key} className={`skill-category${active ? ' has-selection' : ''}`}>
                            <button
                                type="button"
                                className={`skill-category-btn${isOpen ? ' open' : ''}${active ? ' active' : ''}`}
                                onClick={() => toggleCategory(cat.key)}
                            >
                                <span className="skill-category-label">{cat.label}</span>
                                {active && <span className="skill-category-count">{count}</span>}
                                <span className="skill-arrow">{isOpen ? '▲' : '▼'}</span>
                            </button>

                            {isOpen && (
                                <div className="skill-sub-list">
                                    {cat.key === 'other' ? (
                                        <input
                                            className="skill-other-input"
                                            type="text"
                                            placeholder="פרט את התחום שלך..."
                                            value={otherText}
                                            onChange={e => handleOther(e.target.value)}
                                            autoFocus
                                        />
                                    ) : (
                                        cat.sub.map(sub => {
                                            const isActive = selected.includes(sub);
                                            const btnLabel = isActive ? `✓ ${sub}` : sub;
                                            return (
                                                <button
                                                    key={sub}
                                                    type="button"
                                                    className={`skill-sub-btn${isActive ? ' active' : ''}`}
                                                    onClick={() => toggleSub(sub)}
                                                >
                                                    {btnLabel}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selected.length > 0 && (
                <div className="skill-selected-tags">
                    {selected.map((s, i) => {
                        const tagLabel = getSkillLabel(s);
                        return (
                            <span key={i} className="skill-tag">
                                {tagLabel}
                                <button type="button" onClick={() => onChange(selected.filter(x => x !== s))}>×</button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SkillSelector;
