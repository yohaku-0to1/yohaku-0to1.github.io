document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'universal-workbench-presets-v1';
    const SESSION_KEY = 'universal-workbench-session-v1';

    const inputEditor = document.getElementById('input-editor');
    const outputEditor = document.getElementById('output-editor');
    const inputStats = document.getElementById('input-stats');
    const outputStats = document.getElementById('output-stats');
    const processStats = document.getElementById('process-stats');
    const operationsList = document.getElementById('operations-list');
    const fileInput = document.getElementById('file-input');
    const openFileBtn = document.getElementById('open-file-btn');
    const clearInputBtn = document.getElementById('clear-input-btn');
    const loadSampleBtn = document.getElementById('load-sample-btn');
    const addOpBtn = document.getElementById('add-op-btn');
    const runBtn = document.getElementById('run-btn');
    const resetOpsBtn = document.getElementById('reset-ops-btn');
    const copyOutputBtn = document.getElementById('copy-output-btn');
    const downloadOutputBtn = document.getElementById('download-output-btn');
    const presetSelect = document.getElementById('preset-select');
    const savePresetBtn = document.getElementById('save-preset-btn');
    const deletePresetBtn = document.getElementById('delete-preset-btn');

    const OP_DEFS = {
        trim_lines: { label: 'Trim lines', params: [] },
        remove_empty_lines: { label: 'Remove empty lines', params: [] },
        dedupe_lines: { label: 'Dedupe lines', params: [] },
        sort_lines_asc: { label: 'Sort lines (A-Z)', params: [] },
        sort_lines_desc: { label: 'Sort lines (Z-A)', params: [] },
        to_upper: { label: 'To UPPER', params: [] },
        to_lower: { label: 'To lower', params: [] },
        prepend_line: { label: 'Prepend each line', params: [{ key: 'value1', label: 'Prefix', placeholder: '[TODO] ' }] },
        append_line: { label: 'Append each line', params: [{ key: 'value1', label: 'Suffix', placeholder: ' #tag' }] },
        split_text: { label: 'Split text by delimiter', params: [{ key: 'value1', label: 'Delimiter', placeholder: ',' }] },
        join_lines: { label: 'Join lines with delimiter', params: [{ key: 'value1', label: 'Delimiter', placeholder: ', ' }] },
        regex_replace: {
            label: 'Regex replace',
            params: [
                { key: 'value1', label: 'Pattern', placeholder: '\\d+' },
                { key: 'value2', label: 'Replacement', placeholder: '[num]' },
                { key: 'value3', label: 'Flags', placeholder: 'g' }
            ]
        },
        extract_urls: { label: 'Extract URLs', params: [] },
        extract_emails: { label: 'Extract emails', params: [] },
        url_encode: { label: 'URL encode', params: [] },
        url_decode: { label: 'URL decode', params: [] },
        base64_encode: { label: 'Base64 encode (UTF-8)', params: [] },
        base64_decode: { label: 'Base64 decode (UTF-8)', params: [] },
        json_pretty: { label: 'JSON pretty', params: [] },
        json_minify: { label: 'JSON minify', params: [] },
        json_to_csv: { label: 'JSON to CSV', params: [{ key: 'value1', label: 'Delimiter', placeholder: ',' }] },
        csv_to_json: { label: 'CSV to JSON', params: [{ key: 'value1', label: 'Delimiter', placeholder: ',' }] }
    };

    const quickTemplates = {
        'clean-text': [
            { type: 'trim_lines' },
            { type: 'remove_empty_lines' },
            { type: 'dedupe_lines' }
        ],
        'csv-to-json': [
            { type: 'trim_lines' },
            { type: 'csv_to_json', value1: ',' },
            { type: 'json_pretty' }
        ],
        'json-to-csv': [
            { type: 'json_to_csv', value1: ',' }
        ],
        'extract-links': [
            { type: 'extract_urls' },
            { type: 'dedupe_lines' },
            { type: 'sort_lines_asc' }
        ]
    };

    let operations = [{ type: 'trim_lines' }];
    let presets = {};

    function parseSafely(rawValue, fallback) {
        if (!rawValue) return fallback;
        try {
            const parsed = JSON.parse(rawValue);
            return parsed ?? fallback;
        } catch (error) {
            console.warn('Failed to parse JSON from storage.', error);
            return fallback;
        }
    }

    function splitLines(text) {
        return text.replace(/\r\n/g, '\n').split('\n');
    }

    function updateStats() {
        const inputText = inputEditor.value;
        const outputText = outputEditor.value;
        inputStats.textContent = `Input: ${inputText.length} chars / ${splitLines(inputText).length} lines`;
        outputStats.textContent = `Output: ${outputText.length} chars / ${splitLines(outputText).length} lines`;
    }

    function escapeCsvCell(value, delimiter) {
        const safe = String(value ?? '');
        if (safe.includes('"') || safe.includes('\n') || safe.includes('\r') || safe.includes(delimiter)) {
            return `"${safe.replace(/"/g, '""')}"`;
        }
        return safe;
    }

    function parseCsv(text, delimiter = ',') {
        const rows = [];
        let row = [];
        let cell = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
            const char = text[i];
            const next = text[i + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    cell += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (!inQuotes && char === delimiter) {
                row.push(cell);
                cell = '';
                continue;
            }

            if (!inQuotes && (char === '\n' || char === '\r')) {
                if (char === '\r' && next === '\n') i += 1;
                row.push(cell);
                rows.push(row);
                row = [];
                cell = '';
                continue;
            }

            cell += char;
        }

        row.push(cell);
        rows.push(row);
        return rows.filter(r => !(r.length === 1 && r[0] === ''));
    }

    function applyOperation(text, op, opIndex) {
        const lines = splitLines(text);
        const delimiter = op.value1 || ',';

        switch (op.type) {
            case 'trim_lines':
                return lines.map(line => line.trim()).join('\n');
            case 'remove_empty_lines':
                return lines.filter(line => line.trim() !== '').join('\n');
            case 'dedupe_lines': {
                const unique = [];
                const seen = new Set();
                lines.forEach((line) => {
                    if (!seen.has(line)) {
                        seen.add(line);
                        unique.push(line);
                    }
                });
                return unique.join('\n');
            }
            case 'sort_lines_asc':
                return [...lines].sort((a, b) => a.localeCompare(b, 'ja')).join('\n');
            case 'sort_lines_desc':
                return [...lines].sort((a, b) => b.localeCompare(a, 'ja')).join('\n');
            case 'to_upper':
                return text.toUpperCase();
            case 'to_lower':
                return text.toLowerCase();
            case 'prepend_line':
                return lines.map(line => `${op.value1 || ''}${line}`).join('\n');
            case 'append_line':
                return lines.map(line => `${line}${op.value1 || ''}`).join('\n');
            case 'split_text': {
                const sep = op.value1 || ',';
                return text.split(sep).map(piece => piece.trim()).join('\n');
            }
            case 'join_lines':
                return lines.join(op.value1 ?? ', ');
            case 'regex_replace': {
                const pattern = op.value1 || '';
                if (!pattern) return text;
                const flags = op.value3 || 'g';
                const regex = new RegExp(pattern, flags);
                return text.replace(regex, op.value2 || '');
            }
            case 'extract_urls': {
                const matches = text.match(/https?:\/\/[^\s"'<>]+/g) || [];
                return matches.join('\n');
            }
            case 'extract_emails': {
                const matches = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
                return matches.join('\n');
            }
            case 'url_encode':
                return encodeURIComponent(text);
            case 'url_decode':
                return decodeURIComponent(text);
            case 'base64_encode':
                return btoa(unescape(encodeURIComponent(text)));
            case 'base64_decode':
                return decodeURIComponent(escape(atob(text)));
            case 'json_pretty': {
                const parsed = JSON.parse(text);
                return JSON.stringify(parsed, null, 2);
            }
            case 'json_minify': {
                const parsed = JSON.parse(text);
                return JSON.stringify(parsed);
            }
            case 'json_to_csv': {
                const parsed = JSON.parse(text);
                const rowsData = Array.isArray(parsed) ? parsed : [parsed];
                if (rowsData.length === 0) return '';

                const headers = Array.from(new Set(rowsData.flatMap(item => Object.keys(item || {}))));
                const csvRows = [
                    headers.map(header => escapeCsvCell(header, delimiter)).join(delimiter),
                    ...rowsData.map(item =>
                        headers.map(header => escapeCsvCell(item?.[header] ?? '', delimiter)).join(delimiter)
                    )
                ];
                return csvRows.join('\n');
            }
            case 'csv_to_json': {
                const rows = parseCsv(text, delimiter);
                if (rows.length === 0) return '[]';
                const headers = rows[0];
                const objects = rows.slice(1).map((row) => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] ?? '';
                    });
                    return obj;
                });
                return JSON.stringify(objects, null, 2);
            }
            default:
                return text;
        }
    }

    function runPipeline() {
        const startedAt = performance.now();
        let result = inputEditor.value;
        try {
            operations.forEach((op, index) => {
                result = applyOperation(result, op, index);
            });
            outputEditor.value = result;
            const elapsedMs = Math.max(0, performance.now() - startedAt);
            processStats.textContent = `Process: ${operations.length} ops / ${elapsedMs.toFixed(1)}ms`;
        } catch (error) {
            outputEditor.value = '';
            processStats.textContent = `Error: ${error.message}`;
        }
        updateStats();
        persistSession();
    }

    function createOption(type, selectedType) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = OP_DEFS[type].label;
        option.selected = type === selectedType;
        return option;
    }

    function renderOperationRow(op, index) {
        const def = OP_DEFS[op.type] || OP_DEFS.trim_lines;
        const row = document.createElement('div');
        row.className = 'uw-op-row';
        row.dataset.index = String(index);

        const topRow = document.createElement('div');
        topRow.className = 'flex items-center gap-2 mb-2';

        const badge = document.createElement('span');
        badge.className = 'uw-pill';
        badge.textContent = `#${index + 1}`;

        const select = document.createElement('select');
        select.className = 'flex-1 px-2 py-1 rounded-lg text-sm';
        Object.keys(OP_DEFS).forEach((type) => {
            select.appendChild(createOption(type, op.type));
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'px-2 py-1 rounded-lg text-sm';
        removeBtn.textContent = '削除';
        removeBtn.addEventListener('click', () => {
            operations.splice(index, 1);
            if (operations.length === 0) operations.push({ type: 'trim_lines' });
            renderOperations();
            runPipeline();
        });

        topRow.appendChild(badge);
        topRow.appendChild(select);
        topRow.appendChild(removeBtn);

        const paramsWrap = document.createElement('div');
        paramsWrap.className = 'grid grid-cols-1 gap-2';

        def.params.forEach((paramDef) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'px-2 py-1 rounded-lg text-sm';
            input.placeholder = `${paramDef.label} (${paramDef.placeholder || ''})`;
            input.value = op[paramDef.key] || '';
            input.addEventListener('input', () => {
                operations[index][paramDef.key] = input.value;
                runPipeline();
            });
            paramsWrap.appendChild(input);
        });

        select.addEventListener('change', () => {
            operations[index] = { type: select.value };
            renderOperations();
            runPipeline();
        });

        row.appendChild(topRow);
        if (def.params.length > 0) row.appendChild(paramsWrap);
        return row;
    }

    function renderOperations() {
        operationsList.innerHTML = '';
        operations.forEach((op, index) => {
            operationsList.appendChild(renderOperationRow(op, index));
        });
    }

    function persistSession() {
        const payload = {
            input: inputEditor.value,
            operations
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    }

    function restoreSession() {
        const session = parseSafely(localStorage.getItem(SESSION_KEY), null);
        if (!session) return;
        if (typeof session.input === 'string') inputEditor.value = session.input;
        if (Array.isArray(session.operations) && session.operations.length > 0) {
            operations = session.operations;
        }
    }

    function renderPresetOptions() {
        const currentValue = presetSelect.value;
        presetSelect.innerHTML = '<option value="">保存済みプリセットを選択</option>';
        Object.keys(presets).sort((a, b) => a.localeCompare(b, 'ja')).forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelect.appendChild(option);
        });
        presetSelect.value = presets[currentValue] ? currentValue : '';
    }

    function savePresets() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    }

    function restorePresets() {
        presets = parseSafely(localStorage.getItem(STORAGE_KEY), {});
    }

    function loadTemplate(templateName) {
        const template = quickTemplates[templateName];
        if (!template) return;
        operations = template.map(op => ({ ...op }));
        renderOperations();
        runPipeline();
    }

    openFileBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const text = await file.text();
        inputEditor.value = text;
        runPipeline();
    });

    clearInputBtn.addEventListener('click', () => {
        inputEditor.value = '';
        runPipeline();
    });

    addOpBtn.addEventListener('click', () => {
        operations.push({ type: 'trim_lines' });
        renderOperations();
        runPipeline();
    });

    runBtn.addEventListener('click', runPipeline);

    resetOpsBtn.addEventListener('click', () => {
        operations = [{ type: 'trim_lines' }];
        renderOperations();
        runPipeline();
    });

    loadSampleBtn.addEventListener('click', () => {
        inputEditor.value = `name,age,city\nAlice,28,Tokyo\nBob,32,Osaka\nAlice,28,Tokyo\nCharlie,26,Nagoya`;
        operations = [
            { type: 'csv_to_json', value1: ',' },
            { type: 'json_pretty' }
        ];
        renderOperations();
        runPipeline();
    });

    copyOutputBtn.addEventListener('click', async () => {
        if (!outputEditor.value) return;
        try {
            await navigator.clipboard.writeText(outputEditor.value);
            processStats.textContent = 'Process: copied output';
        } catch (error) {
            processStats.textContent = `Error: copy failed (${error.message})`;
        }
    });

    downloadOutputBtn.addEventListener('click', () => {
        const text = outputEditor.value;
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workbench-output-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    savePresetBtn.addEventListener('click', () => {
        const name = window.prompt('プリセット名を入力してください');
        if (!name) return;
        presets[name] = operations;
        savePresets();
        renderPresetOptions();
        presetSelect.value = name;
    });

    presetSelect.addEventListener('change', () => {
        const name = presetSelect.value;
        if (!name || !presets[name]) return;
        operations = presets[name].map(op => ({ ...op }));
        renderOperations();
        runPipeline();
    });

    deletePresetBtn.addEventListener('click', () => {
        const name = presetSelect.value;
        if (!name || !presets[name]) return;
        if (!window.confirm(`プリセット「${name}」を削除しますか？`)) return;
        delete presets[name];
        savePresets();
        renderPresetOptions();
    });

    document.querySelectorAll('.uw-template-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const template = button.dataset.template;
            if (template) loadTemplate(template);
        });
    });

    inputEditor.addEventListener('input', runPipeline);

    window.addEventListener('keydown', async (event) => {
        const isMeta = event.metaKey || event.ctrlKey;
        if (!isMeta) return;

        if (event.key === 'Enter') {
            event.preventDefault();
            runPipeline();
        }

        if (event.shiftKey && event.key.toLowerCase() === 'c') {
            event.preventDefault();
            if (!outputEditor.value) return;
            try {
                await navigator.clipboard.writeText(outputEditor.value);
                processStats.textContent = 'Process: copied output';
            } catch (error) {
                processStats.textContent = `Error: copy failed (${error.message})`;
            }
        }
    });

    restoreSession();
    restorePresets();
    renderPresetOptions();
    renderOperations();
    runPipeline();
});
