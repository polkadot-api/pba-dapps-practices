curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 22
sudo apt-get install unzip
curl -fsSL https://bun.sh/install | bash
source /home/ubuntu/.bashrc


git clone https://github.com/polkadot-api/pba-dapps-practices
cd pba-dapps-practices/
npm i
npx papi
bun run ./faucet.ts

vim ~/.config/ngrok/ngrok.yml
ngrok config check
ngrok start --all

wget https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-stable2412-4/polkadot
wget https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-stable2412-4/polkadot-execute-worker
wget https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-stable2412-4/polkadot-prepare-worker
chmod +x ./polkadot
chmod +x ./polkadot-*

./polkadot --chain=westend-dev --force-authoring --rpc-cors=all --alice --tmp --no-mdns --discover-local --unsafe-force-node-key-generation --rpc-max-connections=100
