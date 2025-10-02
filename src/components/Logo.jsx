import React from 'react';

const Logo = () => {
    return (
        <svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* <!-- Outer square --> */}
            <rect x="10" y="10" width="80" height="80" rx="15" fill="url(#grad1)" />
            
            {/* <!-- Inner "DC" letters --> */}
            <path d="M 30 30 L 30 70 L 50 70 A 20 20 0 0 0 50 30 L 30 30 Z" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 70 30 L 70 70" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default Logo;
