import React, { useState } from 'react';
import { SKILLS_TREE } from '../constants/skills';
import '../styles/components/SkillSelector.css';

const SkillSelector = ({ selected = [], onChange, label = 'מה אני יודע לעשות' }) => {
    const [openCategory, setOpenCategory] = useState(null);
    const [otherText, setOtherText] = useState('');

    const toggleCategory = (key) => {
        setOpenCategory(prev => prev === key ? null : key);
    };

    const toggleSub = (sub) => {
        if (selected.includes(sub)) {
            onChange(selected.filter(s => s !== sub));
        } else {
            onChange([...selected, sub]);
        }
    };

    const handleOther = (val) => {
        setOtherText(val);
        const filtered = selected.filter(s => !s.startsWith('אחר:'));
        if (val.trim()) onChange([...filtered, `אחר:${val.trim()}`]);
        else onChange(filtered);
    };

    const isCategoryActive = (cat) =>
        cat.sub.some(s => selected.includes(s)) ||
        (cat.key === 'other' && selected.some(s => s.startsWith('אחר:')));

    const selectedCount = selected.length;

    return (
        <div className="skill-selector">
            <div className="skill-selector-header">
                <label className="skill-selector-label">{label}</label>
                {selectedCount > 0 && (
                    <span className="skill-selected-count">{selectedCount} נבחרו</span>
                )}
            </div>

            <div className="skill-categories">
                {SKILLS_TREE.map(cat => (
                    <div key={cat.key} className={`skill-category ${isCategoryActive(cat) ? 'has-selection' : ''}`}>
                        <button
                            type="button"
                            className={`skill-category-btn ${openCategory === cat.key ? 'open' : ''} ${isCategoryActive(cat) ? 'active' : ''}`}
                            onClick={() => toggleCategory(cat.key)}
                        >
                            {cat.label}
                            {isCategoryActive(cat) && (
                                <span className="skill-category-count">
                                    {cat.key === 'other'
                                        ? selected.filter(s => s.startsWith('אחר:')).length
                                        : cat.sub.filter(s => selected.includes(s)).length}
                                </span>
                            )}
                            <span className="skill-arrow">{openCategory === cat.key ? '▲' : '▼'}</span>
                        </button>

                        {openCategory === cat.key && (
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
                                    cat.sub.map(sub => (
                                        <button
                                            key={sub}
                                            type="button"
                                            className={`skill-sub-btn ${selected.includes(sub) ? 'active' : ''}`}
                                            onClick={() => toggleSub(sub)}
                                        >
                                            {selected.includes(sub) ? '✓ ' : ''}{sub}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selected.length > 0 && (
                <div className="skill-selected-tags">
                    {selected.map((s, i) => (
                        <span key={i} className="skill-tag">
                            {s.startsWith('אחר:') ? s.replace('אחר:', '') : s}
                            <button type="button" onClick={() => onChange(selected.filter(x => x !== s))}>×</button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SkillSelector;
