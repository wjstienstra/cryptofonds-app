import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {/* Transaction 1 */}
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/01.png" alt="Avatar" />
          <AvatarFallback>BTC</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Bitcoin Bought</p>
          <p className="text-sm text-muted-foreground">
            0.005 BTC
          </p>
        </div>
        <div className="ml-auto font-medium text-red-500">
          -€250.00
        </div>
      </div>

      {/* Transaction 2 */}
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarFallback>ETH</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Ethereum Sold</p>
          <p className="text-sm text-muted-foreground">
            1.2 ETH
          </p>
        </div>
        <div className="ml-auto font-medium text-green-500">
          +€1,850.00
        </div>
      </div>

      {/* Transaction 3 */}
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarFallback>SOL</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Solana Staking Reward</p>
          <p className="text-sm text-muted-foreground">
            0.5 SOL
          </p>
        </div>
        <div className="ml-auto font-medium text-green-500">
          +€12.50
        </div>
      </div>

      {/* Transaction 4 */}
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarFallback>USDT</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Deposit</p>
          <p className="text-sm text-muted-foreground">
            via iDeal
          </p>
        </div>
        <div className="ml-auto font-medium text-green-500">
          +€500.00
        </div>
      </div>
    </div>
  );
}