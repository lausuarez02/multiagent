export interface BlockchainWallet {
  getBalance(): Promise<number>;
  sendTransaction(to: string, amount: number): Promise<string>;
  bridgeAssets(toNetwork: string, amount: number): Promise<string>;
}
