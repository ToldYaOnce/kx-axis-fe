# @toldyaonce/kx-axis-fe

A minimalistic React + TypeScript UI library for composing Conversation Flows and Capture configurations for AI agent platforms.

## Features

- 🎨 Clean, flat design with lots of whitespace
- 🖼️ Canvas-first interaction for flow visualization
- 🔍 Inspector-based configuration (no inline rule soup)
- 🎯 No backend dependencies - pure frontend, config-in / config-out
- 📦 Designed to be embedded into larger applications

## Installation

```bash
npm install @toldyaonce/kx-axis-fe
```

## Usage

```tsx
import { KxAxisComposer } from '@toldyaonce/kx-axis-fe';
import type { ConversationFlow, IndustryCaptureRegistry } from '@toldyaonce/kx-axis-fe';

const myFlow: ConversationFlow = {
  // ... your flow config
};

const registry: IndustryCaptureRegistry = {
  // ... your capture registry
};

function App() {
  const handleChange = (updatedConfig: ConversationFlow) => {
    console.log('Flow updated:', updatedConfig);
  };

  return (
    <KxAxisComposer
      initialConfig={myFlow}
      industryCaptureRegistry={registry}
      onChange={handleChange}
    />
  );
}
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## License

MIT


