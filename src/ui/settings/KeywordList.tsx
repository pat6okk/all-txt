import * as React from 'react';
import { setIcon } from 'obsidian';

interface KeywordListProps {
    title: string;
    keywords: string[];
    onUpdate: (newKeywords: string[], oldKeyword?: string) => void;
    getKeywordColor: (keyword: string) => string;
    onEdit: (keyword: string) => void;
    onDelete: (index: number) => void;
    placeholder?: string;
}

export const KeywordList: React.FC<KeywordListProps> = ({
    title, keywords, onUpdate, getKeywordColor, onEdit, onDelete, placeholder = 'TOKEN'
}: KeywordListProps) => {

    const moveUp = (index: number) => {
        if (index <= 0) return;
        const newKeywords = [...keywords];
        [newKeywords[index - 1], newKeywords[index]] = [newKeywords[index], newKeywords[index - 1]];
        onUpdate(newKeywords);
    };

    const moveDown = (index: number) => {
        if (index >= keywords.length - 1) return;
        const newKeywords = [...keywords];
        [newKeywords[index + 1], newKeywords[index]] = [newKeywords[index], newKeywords[index + 1]];
        onUpdate(newKeywords);
    };

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase(); // Force uppercase
        // We only update state on blur or enter to avoid jitter? 
        // Or specific handler. For now, let's update local state?
        // Actually, parent controls state.
        // We need an intermediate state for input if we want to type without losing focus or validation.
        // For simplicity, let's assume we update on blur or use controlled input.
        // Changing keyword might change color association logic.
        // Let's defer actual update to onBlur.
    };

    const handleBlur = (index: number, e: React.FocusEvent<HTMLInputElement>) => {
        const val = e.target.value.trim().toUpperCase();
        if (val !== keywords[index]) {
            const newKeywords = [...keywords];
            newKeywords[index] = val;
            onUpdate(newKeywords, keywords[index]);
        }
    };

    return (
        <div className="vocab-group" style={{ flex: 1, minWidth: '200px' }}>
            <h4 style={{ textAlign: 'center' }}>{title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {keywords.map((k, idx) => {
                    const color = getKeywordColor(k);
                    return (
                        <div key={`${idx}-${k}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <button
                                    className="clickable-icon"
                                    style={{ height: '12px', lineHeight: '10px', fontSize: '10px', padding: '0 4px', minWidth: '16px', opacity: idx === 0 ? 0.3 : 1 }}
                                    onClick={() => moveUp(idx)}
                                    disabled={idx === 0}
                                >▲</button>
                                <button
                                    className="clickable-icon"
                                    style={{ height: '12px', lineHeight: '10px', fontSize: '10px', padding: '0 4px', minWidth: '16px', opacity: idx === keywords.length - 1 ? 0.3 : 1 }}
                                    onClick={() => moveDown(idx)}
                                    disabled={idx === keywords.length - 1}
                                >▼</button>
                            </div>

                            <input
                                type="text"
                                defaultValue={k}
                                onBlur={(e) => handleBlur(idx, e)}
                                style={{
                                    flex: 1, minWidth: 0, textAlign: 'center', fontWeight: 'bold', height: '30px',
                                    borderLeft: `5px solid ${color}`,
                                    color: color === '#888888' ? 'var(--text-normal)' : color
                                }}
                            />

                            <button style={{ height: '30px' }} onClick={() => onEdit(k)}>Edit</button>
                            <button
                                style={{ height: '30px', width: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-on-accent)', backgroundColor: '#ff5555', border: 'none' }}
                                onClick={() => onDelete(idx)}
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </button>
                        </div>
                    );
                })}
                <button
                    style={{ marginTop: '6px', fontSize: '12px', padding: '4px 12px', height: 'auto', width: 'fit-content', alignSelf: 'flex-start' }}
                    onClick={() => onUpdate([...keywords, ''])}
                >+ add</button>
            </div>
        </div>
    );
};
