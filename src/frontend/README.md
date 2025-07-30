# EVM HTLC Frontend

This is the frontend application for the EVM HTLC (Hash Time Locked Contract) system.

## Prerequisites

- Node.js (v16 or higher)
- dfx (Internet Computer SDK)
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Deploy the canisters:**
   ```bash
   # From the project root
   dfx start --background --clean
   dfx deploy
   dfx generate
   ```

3. **Copy environment variables:**
   ```bash
   # From the project root
   cp .env src/frontend/.env
   ```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run build` - Build for production
- `npm run format` - Format code with Prettier

## Troubleshooting

If you see the browser warning message, it means the canister is not properly deployed or the environment variables are not set correctly.

1. Make sure dfx is running: `dfx start --background`
2. Deploy the canisters: `dfx deploy`
3. Generate declarations: `dfx generate`
4. Copy the .env file to the frontend directory
5. Restart the development server

## Environment Variables

The following environment variables are required:

- `CANISTER_ID_FUSION_HTLC_CANISTER` - The canister ID for the HTLC canister
- `DFX_NETWORK` - The network to use (ic for mainnet, local for development) 