document.addEventListener('DOMContentLoaded', () => {
    // --- Kinetic Typography ---
    const typoPlayBtn = document.getElementById('typo-play');
    typoPlayBtn.addEventListener('click', playTypography);

    // --- Safe Zones ---
    // Handled by inline onclick for simplicity in HTML, but logic is here
    window.toggleOverlay = (platform) => {
        document.querySelectorAll('.safe-zone-overlay').forEach(el => el.style.display = 'none');
        if (platform !== 'none') {
            document.getElementById(`overlay-${platform}`).style.display = 'block';
        }
    };

    // --- Zod Builder ---
    const addFieldBtn = document.getElementById('add-field-btn');
    const genZodBtn = document.getElementById('generate-zod-btn');

    addFieldBtn.addEventListener('click', addZodField);
    genZodBtn.addEventListener('click', generateZodSchema);

    // Add initial field
    addZodField();
});

// --- Kinetic Typography Logic ---
function playTypography() {
    const text = document.getElementById('typo-text').value;
    const type = document.getElementById('typo-type').value;
    const preview = document.getElementById('typo-preview');
    const codeBlock = document.getElementById('typo-code');

    preview.innerHTML = '';
    let code = '';

    if (type === 'char') {
        // Simulation
        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'char-span';
            span.style.transitionDelay = `${i * 0.1}s`;
            preview.appendChild(span);
        });

        // Trigger animation
        setTimeout(() => {
            document.querySelectorAll('.char-span').forEach(s => s.classList.add('char-visible'));
        }, 100);

        // Code Generation
        code = `import { Sequence, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const Typewriter = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = "${text}";

  return (
    <div style={{ fontFamily: 'Inter', fontSize: 80, color: 'white' }}>
      {text.split('').map((char, i) => {
        const delay = i * 5;
        const opacity = frame > delay ? 1 : 0;
        return <span key={i} style={{ opacity }}>{char}</span>;
      })}
    </div>
  );
};`;

    } else if (type === 'word') {
        // Simulation
        text.split(' ').forEach((word, i) => {
            const span = document.createElement('span');
            span.textContent = word + '\u00A0'; // Add space
            span.className = 'char-span';
            span.style.transitionDelay = `${i * 0.3}s`;
            preview.appendChild(span);
        });

        setTimeout(() => {
            document.querySelectorAll('.char-span').forEach(s => s.classList.add('char-visible'));
        }, 100);

        // Code Generation
        code = `import { Sequence } from 'remotion';

export const WordFade = () => {
  const text = "${text}";
  const words = text.split(' ');

  return (
    <div style={{ display: 'flex', gap: '20px', fontSize: 80, color: 'white' }}>
      {words.map((word, i) => (
        <Sequence key={i} from={i * 10}>
          <span style={{ opacity: 1 }}>{word}</span>
        </Sequence>
      ))}
    </div>
  );
};`;
    }

    codeBlock.textContent = code;
}

// --- Zod Builder Logic ---
function addZodField() {
    const container = document.getElementById('zod-fields');
    const div = document.createElement('div');
    div.className = 'flex gap-2 mb-2';
    div.innerHTML = `
        <input type="text" placeholder="Prop Name (e.g. title)" class="prop-name" style="margin-bottom:0;">
        <select class="prop-type" style="margin-bottom:0;">
            <option value="z.string()">String</option>
            <option value="z.number()">Number</option>
            <option value="z.boolean()">Boolean</option>
            <option value="zColor()">Color</option>
        </select>
        <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-300">×</button>
    `;
    container.appendChild(div);
}

function generateZodSchema() {
    const rows = document.querySelectorAll('#zod-fields > div');
    let schemaLines = [];
    let interfaceLines = [];

    rows.forEach(row => {
        const name = row.querySelector('.prop-name').value;
        const type = row.querySelector('.prop-type').value;
        if (name) {
            schemaLines.push(`  ${name}: ${type},`);

            // Simple TS mapping
            let tsType = 'string';
            if (type.includes('number')) tsType = 'number';
            if (type.includes('boolean')) tsType = 'boolean';
            interfaceLines.push(`  ${name}: ${tsType};`);
        }
    });

    const output = `import { z } from 'zod';
import { zColor } from '@remotion/zod-types';

export const myCompSchema = z.object({
${schemaLines.join('\n')}
});

export type MyCompProps = z.infer<typeof myCompSchema>;

// Usage in Root.tsx:
// <Composition
//   schema={myCompSchema}
//   defaultProps={{ ... }}
//   ...
// />`;

    document.getElementById('zod-output').textContent = output;
}
