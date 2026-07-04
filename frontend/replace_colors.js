const fs = require('fs');
const path = require('path');

const directories = [
    "m:\\RF ELECTRO ERP\\frontend\\src\\app\\(admin)",
    "m:\\RF ELECTRO ERP\\frontend\\src\\components"
];

const replacements = {
    "text-copper-signal": "text-blue-600",
    "bg-copper-signal/10": "bg-blue-50",
    "bg-copper-signal": "bg-blue-600",
    "border-copper-signal/20": "border-blue-200",
    "border-copper-signal/30": "border-blue-200",
    "border-copper-signal/40": "border-blue-300",
    "border-copper-signal/50": "border-blue-300",
    "border-copper-signal": "border-blue-500",
    "hover:bg-\\[#965216\\]": "hover:bg-blue-700",
    "focus:border-copper-signal": "focus:border-blue-500",
    "focus:ring-copper-signal": "focus:ring-blue-500",
    "shadow-\\[0_0_20px_rgba\\(181,101,29,0\\.3\\)\\]": "shadow-sm",
    "shadow-\\[0_0_15px_rgba\\(181,101,29,0\\.3\\)\\]": "shadow-sm",
    "text-graphite-ink": "text-slate-900",
    "bg-circuit-blue/10": "bg-sky-50",
    "border-circuit-blue/20": "border-sky-200",
    "text-circuit-blue": "text-sky-600",
    "bg-confirm-green/10": "bg-emerald-50",
    "border-confirm-green/20": "border-emerald-200",
    "text-confirm-green": "text-emerald-600",
    "bg-confirm-green": "bg-emerald-600",
    "hover:bg-\\[#326943\\]": "hover:bg-emerald-700",
    "bg-alert-rust/10": "bg-rose-50",
    "border-alert-rust/20": "border-rose-200",
    "text-alert-rust": "text-rose-600",
    "hover:text-alert-rust": "hover:text-rose-600"
};

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let newContent = content;
    
    for (const [oldStr, newStr] of Object.entries(replacements)) {
        // use regex with global flag
        const re = new RegExp(oldStr, 'g');
        newContent = newContent.replace(re, newStr);
    }
    
    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent, 'utf8');
        console.log(`Updated ${filepath}`);
    }
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

directories.forEach(d => {
    const files = walk(d);
    files.forEach(f => {
        if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            processFile(f);
        }
    });
});
