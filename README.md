# VCMilei MultiAgent System

An autonomous investment decision-making system inspired by Javier Milei's economic principles and investment strategies.

## 🌟 Overview

VCMilei MultiAgent System is an AI-powered investment analysis platform that aggregates data from multiple specialized agents to make informed investment decisions. The system emulates Javier Milei's investment criteria and economic philosophy through a network of specialized agents that analyze different aspects of potential investments.

## 🤖 System Architecture

The system consists of several specialized agents:

### Report Agents
- Market Analysis
- News Monitoring
- Social Media Sentiment

### Research Agents
- Bullish Analysis
- Bearish Analysis
- Legal Compliance

### Core Components
- Blockchain Integration
- Memory Management
- Data Collection
- VCMilei Decision Engine

## 🛠 Tech Stack

- TypeScript
- OpenAI Integration
- Supabase
- Viem (Ethereum Interaction)

## 📁 Project Structure

src/
├── agents/
│ ├── vcmilei/ # Main decision-making agent
│ ├── reports/ # Report generation agents
│ │ ├── market/
│ │ ├── news/
│ │ └── social/
│ ├── legal/ # Legal compliance checking
│ └── research/ # Market research agents
│ ├── bullish/
│ └── bearish/
├── data/ # Data collection modules
│ ├── market/
│ ├── news/
│ └── social/
├── blockchain/ # Blockchain integration
├── memory/ # System memory management
└── utils/ # Utility functions


## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file based on the `.env.example` file.
4. Start the server:
```bash
npm start
```


## 🔑 Environment Variables

Required environment variables:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SOLANA_RPC_URL`

## 📱 Social Media & Links

- Twitter: [@vcmilei](https://twitter.com/vcmilei)
- Website: [vcmilei.fun](https://vcmilei.fun)

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.