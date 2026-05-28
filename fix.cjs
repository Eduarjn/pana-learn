const fs = require('fs');
let code = fs.readFileSync('src/pages/Treinamentos.tsx', 'utf8');

code = code.replace(/C\.textSub/g, "'hsl(var(--muted-foreground))'");
code = code.replace(/C\.textMuted/g, "'hsl(var(--muted-foreground))'");
code = code.replace(/C\.white/g, "'hsl(var(--foreground))'");
code = code.replace(/C\.alabaster/g, "'hsl(var(--foreground))'");
code = code.replace(/C\.navyDark/g, "'hsl(var(--background))'");
code = code.replace(/C\.navyMid/g, "'hsl(var(--background))'");
code = code.replace(/C\.navy/g, "'hsl(var(--background))'");
code = code.replace(/C\.card/g, "'hsl(var(--card))'");
code = code.replace(/C\.borderSoft/g, "'hsl(var(--border))'");
code = code.replace(/C\.border/g, "'hsl(var(--border))'");
code = code.replace(/C\.orangeDim/g, "'hsl(var(--primary))'");
code = code.replace(/C\.orange/g, "'hsl(var(--primary))'");
code = code.replace(/C\.black/g, "'hsl(var(--primary-foreground))'");

fs.writeFileSync('src/pages/Treinamentos.tsx', code);
