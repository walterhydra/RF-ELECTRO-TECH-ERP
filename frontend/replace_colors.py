import os
import re

directories = [
    r"m:\RF ELECTRO ERP\frontend\src\app\(admin)",
    r"m:\RF ELECTRO ERP\frontend\src\components"
]

replacements = {
    "text-copper-signal": "text-blue-600",
    "bg-copper-signal/10": "bg-blue-50",
    "bg-copper-signal": "bg-blue-600",
    "border-copper-signal/20": "border-blue-200",
    "border-copper-signal/30": "border-blue-200",
    "border-copper-signal/40": "border-blue-300",
    "border-copper-signal/50": "border-blue-300",
    "border-copper-signal": "border-blue-500",
    "hover:bg-[#965216]": "hover:bg-blue-700",
    "focus:border-copper-signal": "focus:border-blue-500",
    "focus:ring-copper-signal": "focus:ring-blue-500",
    "shadow-[0_0_20px_rgba(181,101,29,0.3)]": "shadow-sm",
    "shadow-[0_0_15px_rgba(181,101,29,0.3)]": "shadow-sm",
    "text-graphite-ink": "text-slate-900",
    "bg-circuit-blue/10": "bg-sky-50",
    "border-circuit-blue/20": "border-sky-200",
    "text-circuit-blue": "text-sky-600",
    "bg-confirm-green/10": "bg-emerald-50",
    "border-confirm-green/20": "border-emerald-200",
    "text-confirm-green": "text-emerald-600",
    "bg-confirm-green": "bg-emerald-600",
    "hover:bg-[#326943]": "hover:bg-emerald-700",
    "bg-alert-rust/10": "bg-rose-50",
    "border-alert-rust/20": "border-rose-200",
    "text-alert-rust": "text-rose-600",
    "hover:text-alert-rust": "hover:text-rose-600"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))
