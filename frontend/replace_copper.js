const fs = require('fs');
const path = require('path');

const directories = [
    "m:\\RF ELECTRO ERP\\frontend\\src\\app\\(admin)",
    "m:\\RF ELECTRO ERP\\frontend\\src\\components"
];

const replacements = {
    "copper-50": "blue-50",
    "copper-100": "blue-100",
    "copper-200": "blue-200",
    "copper-300": "blue-300",
    "copper-400": "blue-400",
    "copper-500": "blue-500",
    "copper-600": "blue-600",
    "copper-700": "blue-700",
    "copper-800": "blue-800",
    "copper-900": "blue-900"
};

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let newContent = content;
    
    for (const [oldStr, newStr] of Object.entries(replacements)) {
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
